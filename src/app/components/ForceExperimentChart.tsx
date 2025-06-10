"use client"; // This marks the component to run on the client

import type { FC } from 'react';
import React, { useEffect, useRef } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import * as d3 from 'd3';
import {ChartLink, ChartNode, ForceExperimentChartProps} from "@/app/components/ForceExperimentChart_types";
import {drawForce, drawRadioButtons} from "@/app/components/ForceExperimentChart_functions";


const ForceExperimentChart: FC<ForceExperimentChartProps> = ({ containerClass,chartData }) => {
    const ref = useRef(null);
     useEffect(() => {
        // svgs and sizing
        if (!ref.current) return;
        const baseSvg = d3.select(ref.current);
        const svgNode = baseSvg.node();
        if (!svgNode) return;

        const containerNode = d3.select<Element, unknown>(`.${containerClass}Container`).node();
        if (!containerNode) return;
        const {  clientHeight: svgHeight, clientWidth: svgWidth } = containerNode;

        baseSvg.attr('width', svgWidth)
            .attr('height', svgHeight);

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

         const radioButtonChange = (newNetwork: string) => {
             currentNetworkData = chartData.networks.find((f) => f.id === newNetwork);
             if(currentNetworkData){
                 currentNetwork = newNetwork
                 const {nodes,links} = currentNetworkData.data;
                 drawForce(svg,nodes, links, simulation)
             }

         }

         d3.select("#chooseArchitecture")
            .on("change", (event) => {
                const groupFind = chartData.architecture.find((f) => f.arch_name === event.target.value);
                if(groupFind){
                    currentRadioGroup = groupFind;
                    networks = currentRadioGroup.layers.map((m) => m.network);
                    currentNetwork = networks[0];
                    drawRadioButtons(svg, networks,currentNetwork,radioButtonChange);
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
             .text(d => d)

         const simulation = d3
             .forceSimulation()
             .force("x", d3.forceX(svgWidth/2).strength(0.2))
             .force("y", d3.forceY(svgHeight/2).strength(0.2))
             .force("link", d3.forceLink<ChartNode,ChartLink>().id((d) => d.node))
             .force("repel", d3.forceManyBody().strength(-50));

         if(currentNetworkData){
           const {nodes,links} = currentNetworkData.data;
           drawForce(svg,nodes, links, simulation)
         }




    }, [containerClass, chartData]);

    return (
        <svg className={"noselect"} ref={ref}>
            <g className={"chartSvg"}>
                <g className={"linkGroup"}/>
                <g className={"nodeGroup"}/>
            </g>
        </svg>
            );
            };

export default ForceExperimentChart;
