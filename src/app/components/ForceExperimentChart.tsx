"use client"; // This marks the component to run on the client

import type { FC } from 'react';
import React, { useEffect, useRef } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import * as d3 from 'd3';
import {ChartLink, ChartNode, ForceExperimentChartProps} from "@/app/components/ForceExperimentChart_types";
import {
    drawArrowDefs,
    drawForce,
    drawGroupTree, drawLegend, drawNonLinear,
    drawRadioButtons,
    resetNodeAppearance,
    zoomToBounds
} from "@/app/components/ForceExperimentChart_functions";
import FloatingSearch from "@/app/components/FloatingSearch";

export const CIRCLE_RADIUS = 8;
export const COLORS = {lightgreen: "#a1d99b", lightblue: "#6baed6", midblue:"#2171b5", darkblue: "#08306b", red: "#cb181d", green: "#1a9850", grey:"#A0A0A0", midGrey:"#C0C0C0"}


export const NODEFLOW_COLORS = {actions: COLORS.midblue,input: COLORS.lightgreen, intermediate: COLORS.midGrey, successfulOutput: COLORS.green, failedOutput: COLORS.red};
export const NODETYPE_ICONS = {expand: "\u002b",collapse:"\uf068",all: "", any:"\uf141", suppression: "\uf714", layer:"\uf5fd", network:"\uf1eb", depth:"\uf3c5"}
const ForceExperimentChart: FC<ForceExperimentChartProps> = ({ containerClass,chartData,direction }) => {
    const ref = useRef(null);
    const selectedNodes: React.RefObject<string[]> = useRef([]);
    const currentNodeNames: React.RefObject<string[]> = useRef([]);
    useEffect(() => {

        // svgs and sizing
        if (!ref.current) return;
        const baseSvg = d3.select<SVGSVGElement,unknown>(ref.current);

        const svgNode = baseSvg.node();
        if (!svgNode) return;

        const containerNode = d3.select<Element, unknown>(`.${containerClass}Container`).node();
        if (!containerNode) return;
        const {  clientHeight: svgHeight, clientWidth: svgWidth } = containerNode;


        baseSvg.attr('width', svgWidth)
            .attr('height', svgHeight);

        baseSvg.select(".legendGroup")
            .attr("transform",`translate(120,${svgHeight - 35})`);

        drawLegend(baseSvg);
        debugger;


        // network radio group not visible for non-linear
        d3.select("#networkRadioGroup").style("display", direction === "non-linear" ? "none" : "block");

        drawArrowDefs(baseSvg,containerClass);

         const zoom = d3
             .zoom<SVGSVGElement, unknown>()
             .scaleExtent([0.1,1])
             .on("zoom", (event) => {
                 const { x, y, k } = event.transform;
                 svg.attr("transform", `translate(${x},${y}) scale(${k})`);

             });

         const resetZoom = () => baseSvg.call(zoom.transform, d3.zoomIdentity);
         const clearTreePosition = (nodes: ChartNode[]) => nodes.map((m) => m.treePositionScale = undefined);

         baseSvg.call(zoom).on("dblclick.zoom", null);

        // svg = parts which are affected by zoom
        const svg = baseSvg.select(".chartSvg");

        const architectures = d3.map(chartData.architecture,(m) => m.arch_name);

         let currentRadioGroup = chartData.architecture[0];
         let networks = currentRadioGroup.layers.map((m) => m.network);
         let currentNetwork = networks[0];
         let currentNetworkData = chartData.networks.find((f) => f.id === currentNetwork);


         d3.select("#chooseArchitecture")
            .selectAll("option")
            .data(architectures)
            .join("option")
            .attr("value", (d) => d)
            .text((d) => d);

         const sideMargin = 100;


         const forcePosition = direction === "vertical" ? "forceX" : "forceY";
         const forceOpposite = direction === "vertical" ? "forceY" : "forceX";
         const scaleRange = direction === "vertical" ? [0, svgWidth - (sideMargin * 2)] : [0, svgHeight - (sideMargin * 2)]
         const oppositeCentre = direction === "vertical" ? svgHeight/2 : svgWidth/2;

         const resetNodeNames = (nodeArray: string[]) => currentNodeNames.current = nodeArray;

         const positionScale = d3.scaleLinear()
             .range(scaleRange)

        const callZoomToBounds = (currentNodes: ChartNode[]) => {
            zoomToBounds(currentNodes, baseSvg,svgWidth,svgHeight,zoom)
        }
         const radioButtonChange = (newNetwork: string) => {
             // not applicable to non-linear
             selectedNodes.current = [];
             if(newNetwork === "All"){
                 currentNodeNames.current = [];
                 drawForce(svg,[], [], simulation,direction,selectedNodes,containerClass,callZoomToBounds);
                 resetZoom();
                 drawGroupTree(baseSvg, currentRadioGroup,chartData,svgWidth,svgHeight, false, direction,containerClass,simulation,selectedNodes,resetNodeNames, callZoomToBounds);
             } else {
                 drawGroupTree(baseSvg, currentRadioGroup,chartData,svgWidth,svgHeight, true, direction,containerClass,simulation,selectedNodes,resetNodeNames,callZoomToBounds);
                 currentNetworkData = chartData.networks.find((f) => f.id === newNetwork);
                 if(currentNetworkData){
                     currentNetwork = newNetwork;
                     const {nodes,links} = currentNetworkData.data;
                     currentNodeNames.current = nodes.map((m) => m.node);
                     const depthExtent = d3.extent(nodes, (d) => d.nodeDepth);
                     if(depthExtent[0] !== undefined && depthExtent[1] !== undefined){
                         positionScale.domain(depthExtent);
                     }
                     clearTreePosition(nodes);
                     drawForce(svg,nodes, links, simulation,direction,selectedNodes,containerClass,callZoomToBounds);
                 }
             }

         }

         d3.select("#chooseArchitecture")
            .on("change", (event) => {
                selectedNodes.current = [];
                const groupFind = chartData.architecture.find((f) => f.arch_name === event.target.value);
                if(groupFind){
                    currentRadioGroup = groupFind;
                    networks = currentRadioGroup.layers.map((m) => m.network);
                    currentNetwork = networks[0];
                    if(direction === "non-linear"){
                        drawGroupTree(baseSvg,currentRadioGroup,chartData,svgWidth,svgHeight,true, direction,containerClass,simulation,selectedNodes,resetNodeNames,callZoomToBounds)
                        drawForce(svg,[], [], simulation,direction,selectedNodes,containerClass,callZoomToBounds);
                        resetZoom();
                        drawNonLinear(svg,currentRadioGroup,chartData,svgWidth,svgHeight);
                    } else {
                        drawGroupTree(baseSvg,currentRadioGroup,chartData,svgWidth,svgHeight,true, direction,containerClass,simulation,selectedNodes,resetNodeNames,callZoomToBounds)
                        drawRadioButtons(svg, networks,currentNetwork,radioButtonChange);
                        radioButtonChange(currentNetwork);
                    }
                }
            });



         drawRadioButtons(svg, networks,currentNetwork,radioButtonChange);


         d3.select("#networkRadioGroup")
             .selectAll("input")
             .data(networks)
             .join("input")
             .attr('type', 'radio')
             .attr('name', 'networkRadioGroup')
           .attr('id', (d) => d)
             .attr("value", (d) => d)

         d3.select("#networkRadioGroup")
             .selectAll("label")
             .data(networks)
             .join("label")
             .attr('for', d => d)
             .text(d => d);


         const simulation = d3
             .forceSimulation()
             .force("x", d3[forcePosition]<ChartNode>((d) =>  (d.treePositionScale ? d.treePositionScale(d.nodeDepth) : sideMargin + positionScale(d.nodeDepth))).strength(1))
             .force("y", d3[forceOpposite]<ChartNode>((d) => d.oppositePos ? d.oppositePos : oppositeCentre).strength(1))
             .force("link", d3.forceLink<ChartNode,ChartLink>().id((d) => d.id).strength(0))

         simulation.stop();
         if(currentNetworkData){
           const {nodes,links} = currentNetworkData.data;
           currentNodeNames.current = nodes.map((m) => m.node);
           const depthExtent = d3.extent(nodes, (d) => d.nodeDepth);
           if(depthExtent[0] !== undefined && depthExtent[1] !== undefined){
               positionScale.domain(depthExtent);
           }
           if(direction === "non-linear"){
               drawGroupTree(baseSvg,currentRadioGroup,chartData,svgWidth,svgHeight,true, direction,containerClass,simulation,selectedNodes,resetNodeNames,callZoomToBounds)
               drawForce(svg,[], [], simulation,direction,selectedNodes,containerClass,callZoomToBounds);
               resetZoom();
               drawNonLinear(svg,currentRadioGroup,chartData,svgWidth,svgHeight);
           } else {
               drawGroupTree(baseSvg,currentRadioGroup,chartData,svgWidth,svgHeight,true,direction,containerClass,simulation,selectedNodes,resetNodeNames,callZoomToBounds)
               clearTreePosition(nodes);
               drawForce(svg,nodes, links, simulation,direction,selectedNodes,containerClass,callZoomToBounds);
               zoomToBounds(nodes, baseSvg,svgWidth,svgHeight,zoom);
           }
         }


    }, [containerClass, chartData, direction]);

    const handleSelectedNodes = (selected: string[]): void => {
        selectedNodes.current = selected;
        const svg = d3.select(".chartSvg");
        if(svg){
            resetNodeAppearance(svg, selected);
        }
    };
    return (
        <>
        <FloatingSearch entriesRef={currentNodeNames} onSelect={handleSelectedNodes}/>
        <svg className={"noselect"} ref={ref}>
            <defs>
                <marker id={`arrowStart${containerClass}`}>
                    <path id={"arrowPathStart"}/>
                </marker>
                <marker id={`arrowEnd${containerClass}`}>
                    <path id={"arrowPathEnd"}/>
                </marker>
                <marker id={`arrowNodeStart${containerClass}`}>
                    <path id={"arrowNodePathStart"}/>
                </marker>
                <marker id={`arrowNodeEnd${containerClass}`}>
                    <path id={"arrowNodePathEnd"}/>
                </marker>
            </defs>
            <g className={"legendGroup"}/>
            <g className={"chartSvg"}>
                <g className={"linkGroup"}/>
                <g className={"nodeGroup"}/>
                <g className={"treeGroup"}/>
            </g>
        </svg></>
            );
            };

export default ForceExperimentChart;
