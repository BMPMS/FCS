import * as d3 from "d3";
import {ChartLink, ChartNode} from "@/app/components/ForceExperimentChart_types";

export const drawRadioButtons = (
    svg: d3.Selection<d3.BaseType, unknown, HTMLElement, unknown>,
    data: string[],
    currentNetwork: string,
    radioButtonChange: (newNetwork: string) => void) => {

    // final group - lineDotsMetricGroup - with the dots
    const networkGroup =  d3.select("#networkRadioGroup")
        .selectAll(".radioDiv")
        .data(data)
        .join((group) => {
            const enter = group.append("div").attr("class", "radioDiv");
            enter.append("input").attr("class", "radioInput");
            enter.append("label").attr("class", "radioLabel");
            return enter;
        });

    networkGroup
        .style("display","inline-block")
        .style("padding","0px 2px 0px 2px");

    networkGroup.select(".radioInput")
        .attr('type', 'radio')
        .attr('name', 'networkRadioGroup')
        .attr('id', (d) => d)
        .attr("value", (d) => d)
        .property('checked', (d) => d === currentNetwork)

    networkGroup.select(".radioLabel")
        .style("padding","0px 2px 0px 2px")
        .attr('for', d => d)
        .text(d => d)

    d3.selectAll('input[name="networkRadioGroup"]')
        .on("change", (event) => {
            radioButtonChange(event.target.value);
        } )
}

export const drawForce = (
    svg: d3.Selection<d3.BaseType, unknown, HTMLElement, unknown>,
    nodes: ChartNode[],
    links: ChartLink[],
    simulation:  d3.Simulation<d3.SimulationNodeDatum, undefined>) => {

    console.log(nodes.map((m) => m.node));
    // stop radius while you append shapes
    simulation.stop();

    // links group (just a line but you could add labels etc.)
    const linksGroup = svg
        .select(".linkGroup")
        .selectAll(".linksGroup")
        .data(links)
        .join((group) => {
            const enter = group.append("g").attr("class", "linksGroup");
            enter.append("line").attr("class", "linkLine");
            return enter;
        });

    linksGroup
        .select(".linkLine")
        .attr("stroke-width", 1)
        .attr("stroke",  "#A0A0A0");

    // nodes group (just a circle but you could add labels etc.)
    const nodesGroup = svg
        .select(".nodeGroup")
        .selectAll(".nodesGroup")
        .data(nodes)
        .join((group) => {
            const enter = group.append("g").attr("class", "nodesGroup");
            enter.append("circle").attr("class", "nodeCircle");
            return enter;
        });

    const circleRadius = 10;
    nodesGroup
        .select(".nodeCircle")
        .attr("r", circleRadius)
        .attr("fill", "#3182bd");

    // as the simulation ticks, reposition links and node groups
    simulation.on("tick", () => {
        svg
            .selectAll<SVGLineElement,ChartLink>(".linkLine")
            .attr("x1", (d) => (d.source as ChartNode).x!)
            .attr("x2", (d) => (d.target as ChartNode).x!)
            .attr("y1", (d) => (d.source as ChartNode).y!)
            .attr("y2", (d) => (d.target as ChartNode).y!);

        nodesGroup.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // reset the simulation
    simulation.nodes([]);
    simulation.nodes(nodes);
    const linkForce = simulation.force("link");
    if(linkForce){
        (linkForce as d3.ForceLink<ChartNode,ChartLink>).links([]);
        (linkForce as d3.ForceLink<ChartNode,ChartLink>).links(links);
    }
;
    // reset the simulation
    simulation.nodes(nodes);
    simulation.alpha(1).restart();
}
