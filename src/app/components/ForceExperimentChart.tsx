"use client"; // This marks the component to run on the client

import type { FC } from 'react';
import React, { useEffect, useRef } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '@fortawesome/fontawesome-pro/css/all.min.css';

import * as d3 from 'd3';
import {ChartLink, ChartNode, ForceExperimentChartProps, NodeChain} from "@/app/components/ForceExperimentChart_types";
import {
    drawArrowDefs,
    drawForce,
    drawGroupTree, drawLegend, drawNonLinear,
    drawRadioButtons, handleAnimationFlow,
    resetNodeAppearance,
    zoomToBounds
} from "@/app/components/ForceExperimentChart_functions";
import FloatingSearch from "@/app/components/FloatingSearch";

export const CIRCLE_RADIUS = 12;
export const COLORS = {
        lightgreen: "#a1d99b",
        midgreen: "#41ab5d",
        darkgreen: "#006d2c",
        lightblue: "#6baed6",
        orange: "#fd8d3c",
        midblue: "#2171b5",
        darkblue: "#08306b",
        red: "#cb181d",
        grey: "#A0A0A0",
        lightgrey: "#E0E0E0",
        midgrey: "#C0C0C0",
        darkgrey: "#808080",
        black: "#484848"
    };

export const NODEFLOW_COLORS = {
        input: COLORS.midblue,
        intermediate: COLORS.midgrey,
        output: COLORS.orange,
        successfulOutput: COLORS.orange,
        failedOutput: COLORS.red,
        successfulLink: COLORS.midgreen,
        suppressedLink: COLORS.red,
        link: COLORS.midgrey
    };
export const NODETYPE_ICONS = {
        all: "\ue439",
        any: "\ue438",
        suppression: "\uf714",
        layer: "\uf5fd",
        network: "\uf126",
        depth: "\uf3c5"
    };

const ForceExperimentChart: FC<ForceExperimentChartProps> = ({
      containerClass,
      chartData,
      direction,
      flowMode}) => {
    const ref = useRef(null);
    const selectedNodes: React.RefObject<string[]> = useRef([]);
    const currentNodeNames: React.RefObject<string[]> = useRef([]);
    const flowNodeChains: React.RefObject<NodeChain[]> = useRef([]);
    const flowChartData: React.RefObject<{nodes: ChartNode[],links:ChartLink[] }> = useRef({nodes: [],links:[]});

    useEffect(() => {

        // svgs and sizing
        if (!ref.current) return;
        const baseSvg = d3.select<SVGSVGElement,unknown>(ref.current);

        const svgNode = baseSvg.node();
        if (!svgNode) return;

        const containerNode = d3.select<Element, unknown>(`.${containerClass}Container`).node();
        if (!containerNode) return;
        const {  clientHeight: svgHeight, clientWidth: svgWidth } = containerNode;

        d3.select("#flowModeToggle")
            .style("display",direction === "non-linear" ? "none" :"block");

        baseSvg.attr('width', svgWidth)
            .attr('height', svgHeight);

        baseSvg.select(".legendGroup")
            .attr("transform",`translate(120,${svgHeight - 35})`);

        drawLegend(baseSvg,direction,flowMode);


        // network radio group not visible for non-linear
        d3.select("#networkRadioGroup").style("display", direction === "non-linear" ? "none" : "block");

        drawArrowDefs(baseSvg,containerClass);

         const zoom = d3
             .zoom<SVGSVGElement, unknown>()
             .scaleExtent([0.1,2])
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

        const updateFlowChartData = (currentNodes: ChartNode[], currentLinks: ChartLink[]) => {
            flowChartData.current = {nodes: currentNodes,links: currentLinks};
        }
         const radioButtonChange = (newNetwork: string) => {
             // not applicable to non-linear
             selectedNodes.current = [];
             flowNodeChains.current = [];
             if(newNetwork === "All"){
                 currentNodeNames.current = [];
                 drawForce(svg,[], [], simulation,direction,selectedNodes,containerClass,callZoomToBounds,flowMode,flowNodeChains,updateFlowChartData);
                 resetZoom();
                 drawGroupTree(baseSvg, currentRadioGroup,chartData,svgWidth,svgHeight, false, direction,containerClass,simulation,selectedNodes,resetNodeNames, callZoomToBounds,flowMode,flowNodeChains,updateFlowChartData);
             } else {
                 drawGroupTree(baseSvg, currentRadioGroup,chartData,svgWidth,svgHeight, true, direction,containerClass,simulation,selectedNodes,resetNodeNames,callZoomToBounds,flowMode,flowNodeChains,updateFlowChartData);
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
                     drawForce(svg,nodes, links, simulation,direction,selectedNodes,containerClass,callZoomToBounds,flowMode,flowNodeChains,updateFlowChartData);
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
                        drawGroupTree(baseSvg,currentRadioGroup,chartData,svgWidth,svgHeight,true, direction,containerClass,simulation,selectedNodes,resetNodeNames,callZoomToBounds,flowMode,flowNodeChains,updateFlowChartData)
                        drawForce(svg,[], [], simulation,direction,selectedNodes,containerClass,callZoomToBounds,flowMode,flowNodeChains,updateFlowChartData);
                        resetZoom();
                        drawNonLinear(svg,currentRadioGroup,chartData,svgWidth,svgHeight,containerClass);
                    } else {
                        drawGroupTree(baseSvg,currentRadioGroup,chartData,svgWidth,svgHeight,true, direction,containerClass,simulation,selectedNodes,resetNodeNames,callZoomToBounds,flowMode,flowNodeChains,updateFlowChartData)
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
               drawGroupTree(baseSvg,currentRadioGroup,chartData,svgWidth,svgHeight,true, direction,containerClass,simulation,selectedNodes,resetNodeNames,callZoomToBounds,flowMode,flowNodeChains,updateFlowChartData)
               drawForce(svg,[], [], simulation,direction,selectedNodes,containerClass,callZoomToBounds,flowMode,flowNodeChains,updateFlowChartData);
               resetZoom();
               drawNonLinear(svg,currentRadioGroup,chartData,svgWidth,svgHeight,containerClass);
           } else {
               drawGroupTree(baseSvg,currentRadioGroup,chartData,svgWidth,svgHeight,true,direction,containerClass,simulation,selectedNodes,resetNodeNames,callZoomToBounds,flowMode,flowNodeChains,updateFlowChartData)
               clearTreePosition(nodes);
               drawForce(svg,nodes, links, simulation,direction,selectedNodes,containerClass,callZoomToBounds,flowMode,flowNodeChains,updateFlowChartData);
               zoomToBounds(nodes, baseSvg,svgWidth,svgHeight,zoom);
           }
         }
         if(flowMode){
             d3.select(".flowStart")
                 .on("click", () => {
                     const currentFlowData = flowChartData.current;
                     const {nodes, links} = currentFlowData;
                     const transitionTime = 500;
                     if(selectedNodes.current.length > 0){
                         handleAnimationFlow(svg,selectedNodes.current, flowNodeChains.current,nodes,links,transitionTime,containerClass)
                     }
                 })
         }


    }, [containerClass, chartData, direction,flowMode]);

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
        {flowMode && (
            <button className={"flowStart absolute z-50 top-2 px-1 py-0.5 mt-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition"}>
                Start Flow
            </button>
        )}
        {direction==="non-linear" && (
            <button style={{ visibility: "hidden" }} className={"expandChain absolute z-50 top-2 px-1 py-0.5 mt-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition"}>
                Expand Chain
            </button>
        )}
        <svg className={"noselect"} ref={ref}>
            <defs className={"arrowDefs"}>
            </defs>
            <g className={"chartSvg"}>
                <g className={"treeGroup"}/>
                <g className={"linkGroup"}/>
                <g className={"nodeGroup"}/>
            </g>
            <g className={"legendGroup"}/>
        </svg></>
            );
            };

export default ForceExperimentChart;
