import * as d3 from "d3";
import {Architecture, ChartData, ChartLink, ChartNode} from "@/app/components/ForceExperimentChart_types";
import {CIRCLE_RADIUS} from "@/app/components/ForceExperimentChart";
import { HierarchyRectangularNode} from "d3";

export const drawRadioButtons = (
    svg: d3.Selection<d3.BaseType, unknown, HTMLElement, unknown>,
    data: string[],
    currentNetwork: string,
    radioButtonChange: (newNetwork: string) => void) => {

    if(!data.some((s) => s === "All")){
        data.push("All")
    }

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


    nodesGroup
        .select(".nodeCircle")
        .attr("r", CIRCLE_RADIUS)
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

    simulation.stop();
    simulation.alpha(1).restart();
    simulation.tick(500);

}

export const  zoomToBounds = (
    currentNodes: ChartNode[],
    baseSvg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>,
    width: number,
    height: number,
    zoom: d3.ZoomBehavior<SVGSVGElement, unknown>) => {
    // get zoom extent and fit to scale
    const [xExtent0, xExtent1] = d3.extent(currentNodes, (d) => d.fx || d.x);
    const [yExtent0, yExtent1] = d3.extent(currentNodes, (d) => d.fy || d.y);
    if (xExtent0 && xExtent1 && yExtent0 && yExtent1) {
        const xWidth = xExtent1 - xExtent0 ;
        const yWidth = yExtent1 - yExtent0;
        const translateX =  -(xExtent0 + xExtent1) / 2;
        const translateY =  -(yExtent0 + yExtent1) / 2;
        const margin = 20;

        const fitToScale = 0.8 / Math.max(xWidth / (width - margin), yWidth / (height - margin));

        baseSvg
            .interrupt()
            .transition()
            .duration(500)
            .call(
                zoom.transform,
                d3.zoomIdentity
                    .translate(width / 2, height / 2)
                    .scale(fitToScale > 1 ? 1 : fitToScale)
                    .translate(fitToScale > 1 ? -width/2 : translateX, fitToScale > 1 ? -height/2 : translateY),
            );
    }
}

type TreeData = {
    layer: number;
    name: string;
    value: number;
}

type TreeHierarchy = {
    name: string;
    children: TreeData[];
    layer: number;
}
const getTreeData = (
    architecture: Architecture,
    chartData: ChartData,
    svgWidth: number,
    svgHeight: number,
    margin: number
) => {

    const treeData = architecture.layers.reduce((acc, entry) => {
        const networkData = chartData.networks.find((f) => f.id === entry.network);
        acc.push({
            layer: entry.layer,
            name: entry.network,
            value: networkData?.data.nodes?.length || 0
        })
        return acc;
    },[] as TreeData[])

    const hierarchy = d3.hierarchy<TreeHierarchy>({name: "root", children: treeData, layer: -1});

    hierarchy.count();

    const padding = 10;
    const tree = d3.treemap<TreeHierarchy>()
        .tile(d3.treemapDice)
        .size([svgWidth - margin * 2, svgHeight - margin * 2])
        .round(true)
        .padding(padding);

    const treeChartData: HierarchyRectangularNode<TreeHierarchy>[] = tree(hierarchy).descendants();

    return Array.from(d3.group(treeChartData, (d) => d.data.layer))
        .filter((f) => f[0] >= 0)
        .reduce((acc, entry) => {
            const firstEntry = entry[1][0];
            if(entry[1].length === 1) {
                firstEntry.y0 = firstEntry.y0 - padding;
                firstEntry.y1 = firstEntry.y1 + padding;
                acc.push(firstEntry)
            } else {

                const xMin = d3.min(entry[1], (d) => d.x0);
                const xMax = d3.max(entry[1], (d) => d.x1);
                const height = firstEntry.y1 - firstEntry.y0;
                const entryHeight = (height - (entry[1].length - 1 * padding))/entry[1].length;
                entry[1].map((m,i) => {
                    m.x0 = xMin || m.x0;
                    m.x1 = xMax || m.x1;
                    m.y0 = i * (entryHeight + padding);
                    m.y1 = entryHeight + (i * (entryHeight + padding))
                })
                acc = acc.concat(entry[1]);
            }
            return acc;
        },[] as HierarchyRectangularNode<TreeHierarchy>[])
    ;
}
export const drawGroupTree = (
    baseSvg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>,
    architecture: Architecture,
    chartData: ChartData,
    svgWidth: number,
    svgHeight: number,
    clearChart: boolean
) => {


    const margin = 20;
    const groupedTreeChartData = clearChart ? [] : getTreeData(architecture,chartData,svgWidth,svgHeight,margin);

    const nodesGroup = baseSvg
        .selectAll<SVGGElement,HierarchyRectangularNode<TreeHierarchy>>(".treeNodeGroup")
        .data(groupedTreeChartData)
        .join((group) => {
            const enter = group.append("g").attr("class", "treeNodeGroup");
            enter.append("rect").attr("class", "treeRect");
            enter.append("text").attr("class", "treeRectLabel");
            return enter;
        });

    nodesGroup.attr("transform", d => `translate(${margin + d.x0},${margin + d.y0})`)


    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    nodesGroup.select(".treeRectLabel")
        .attr("pointer-events","none")
        .attr("x",4)
        .attr("y",12)
        .attr("fill",(d) => d.depth === 1 ? "#808080" : "white")
        .attr("font-size",12)
        .text((d) =>  d.data.name)

    nodesGroup.select(".treeRect")
        .attr("width",(d) => d.x1 - d.x0)
        .attr("height", (d) => d.y1 - d.y0)
        .attr("stroke-width",(d) => d.depth === 2 ? 0 : 1)
        .attr("stroke",(d) => d.depth === 1 ? colorScale(d.data.name) : "white")
        .attr("fill","white")


}
