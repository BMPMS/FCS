"use client"; // This marks the component to run on the client

import type { FC } from 'react';
import React, { useEffect, useRef } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import * as d3 from 'd3';
import {ChartLink, ChartNode, ForceExperimentChartProps} from "@/app/components/ForceExperimentChart_types";
import {
    drawForce,
    drawGroupTree,
    drawRadioButtons,
    zoomToBounds
} from "@/app/components/ForceExperimentChart_functions";

export const CIRCLE_RADIUS = 10;

const ForceExperimentChart: FC<ForceExperimentChartProps> = ({ containerClass,chartData,direction }) => {
    const ref = useRef(null);
     useEffect(() => {
        // svgs and sizing
        if (!ref.current) return;
        const baseSvg = d3.select<SVGSVGElement,unknown>(ref.current);
        const svgNode = baseSvg.node();
        if (!svgNode) return;

        const containerNode = d3.select<Element, unknown>(`.${containerClass}Container`).node();
        if (!containerNode) return;
        const {  clientHeight: svgHeight, clientWidth: svgWidth } = containerNode;

        const arrowFill = "#A0A0A0";
        baseSvg.attr('width', svgWidth)
            .attr('height', svgHeight);

        baseSvg.select(`#arrowStart${containerClass}`)
             .attr("viewBox", "0 -5 10 10")
             .attr("refX", 5)
             .attr("markerWidth", 6)
             .attr("markerHeight", 6)
             .attr("orient", "auto");

         baseSvg.select(`#arrowPathStart`)
             .attr("fill", arrowFill)
             .attr("stroke-linecap", "round")
             .attr("stroke-linejoin", "round")
             .attr("d", "M9,-4L1,0L9,4");

        baseSvg.select(`#arrowEnd${containerClass}`)
             .attr("viewBox", "0 -5 10 10")
             .attr("refX", 8)
             .attr("markerWidth", 8)
             .attr("markerHeight", 8)
             .attr("orient", "auto");

         baseSvg.select(`#arrowPathEnd`)
             .attr("fill", arrowFill)
             .attr("stroke-linecap", "round")
             .attr("stroke-linejoin", "round")
             .attr("d", "M1, -4L9,0L1,4");


         const zoom = d3
             .zoom<SVGSVGElement, unknown>()
             .scaleExtent([0.1,1])
             .on("zoom", (event) => {
                 const { x, y, k } = event.transform;
                 svg.attr("transform", `translate(${x},${y}) scale(${k})`);

             });

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


         const positionScale = d3.scaleLinear()
             .range(scaleRange)


         const radioButtonChange = (newNetwork: string) => {
             if(newNetwork === "All"){
                 drawForce(svg,[], [], simulation,direction);
                 drawGroupTree(baseSvg, currentRadioGroup,chartData,svgWidth,svgHeight, false, direction,containerClass);
             } else {
                 drawGroupTree(baseSvg, currentRadioGroup,chartData,svgWidth,svgHeight, true, direction,containerClass);

                 currentNetworkData = chartData.networks.find((f) => f.id === newNetwork);
                 if(currentNetworkData){
                     currentNetwork = newNetwork;
                     const {nodes,links} = currentNetworkData.data;
                     const depthExtent = d3.extent(nodes, (d) => d.nodeDepth);
                     if(depthExtent[0] !== undefined && depthExtent[1] !== undefined){
                         positionScale.domain(depthExtent);
                     }
                     drawForce(svg,nodes, links, simulation,direction);
                     zoomToBounds(nodes, baseSvg,svgWidth,svgHeight,zoom)
                 }
             }

         }

         d3.select("#chooseArchitecture")
            .on("change", (event) => {
                const groupFind = chartData.architecture.find((f) => f.arch_name === event.target.value);
                if(groupFind){
                    currentRadioGroup = groupFind;
                    networks = currentRadioGroup.layers.map((m) => m.network);
                    currentNetwork = networks[0];
                    drawGroupTree(baseSvg,currentRadioGroup,chartData,svgWidth,svgHeight,true, direction,containerClass)
                    drawRadioButtons(svg, networks,currentNetwork,radioButtonChange);
                    radioButtonChange(currentNetwork);
                }
            });


        drawRadioButtons(svg,networks,currentNetwork,radioButtonChange);

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
             .force("x", d3[forcePosition]<ChartNode>((d) => sideMargin + positionScale(d.nodeDepth)).strength(1))
             .force("y", d3[forceOpposite](oppositeCentre).strength(0.05))
             .force("link", d3.forceLink<ChartNode,ChartLink>().id((d) => d.node).strength(0))
             .force("collide",d3.forceCollide().radius(CIRCLE_RADIUS * 1.5))
             .force("repel", d3.forceManyBody().strength(-50));

         if(currentNetworkData){
           const {nodes,links} = currentNetworkData.data;
           const depthExtent = d3.extent(nodes, (d) => d.nodeDepth);
           if(depthExtent[0] !== undefined && depthExtent[1] !== undefined){
               positionScale.domain(depthExtent);
           }
           drawGroupTree(baseSvg,currentRadioGroup,chartData,svgWidth,svgHeight,true,direction,containerClass)
           drawForce(svg,nodes, links, simulation,direction);
           zoomToBounds(nodes, baseSvg,svgWidth,svgHeight,zoom);
         }




    }, [containerClass, chartData, direction]);

    return (
        <svg className={"noselect"} ref={ref}>
            <defs>
                <marker id={`arrowStart${containerClass}`}>
                    <path id={"arrowPathStart"}/>
                </marker>
                <marker id={`arrowEnd${containerClass}`}>
                    <path id={"arrowPathEnd"}/>
                </marker>
            </defs>
            <g className={"chartSvg"}>
                <g className={"linkGroup"}/>
                <g className={"nodeGroup"}/>
            </g>
        </svg>
            );
            };

export default ForceExperimentChart;
