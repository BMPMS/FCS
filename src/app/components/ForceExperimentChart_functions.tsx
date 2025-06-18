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
    simulation:  d3.Simulation<d3.SimulationNodeDatum, undefined>,
    direction: string) => {
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

    const maxDepth = d3.max(nodes, (d) => d.nodeDepth) || 0;
    // nodes group (just a circle but you could add labels etc.)
    const nodesGroup = svg
        .select(".nodeGroup")
        .selectAll(".nodesGroup")
        .data(nodes)
        .join((group) => {
            const enter = group.append("g").attr("class", "nodesGroup");
            enter.append("circle").attr("class", "nodeCircle");
            enter.append("text").attr("class", "nodeLabel");
            return enter;
        });


    nodesGroup
        .select(".nodeCircle")
        .attr("r", CIRCLE_RADIUS)
        .attr("fill", "#3182bd");

    const getTextAnchor = (d: ChartNode) => {
        if(direction === "vertical"){
            if(d.nodeDepth <= maxDepth/2) return "end";
            if(d.nodeDepth > maxDepth/2) return "start";
        }
        return "middle";
    }

    const getDy = (d: ChartNode) => {
        if(direction === "horizontal"){
            if(d.nodeDepth <= 1) return -(CIRCLE_RADIUS + 2);
            if(d.nodeDepth > maxDepth/2) return CIRCLE_RADIUS + 12;
        }
        return 2;
    }

    const getDx = (d: ChartNode) => {
        if(direction === "vertical"){
            if(d.nodeDepth <= maxDepth/2) return -(CIRCLE_RADIUS + 2);
            if(d.nodeDepth > maxDepth/2) return CIRCLE_RADIUS + 2;
        }
        return 0;
    }
    nodesGroup
        .select(".nodeLabel")
        .attr("text-anchor",getTextAnchor)
        .attr("font-size",10)
        .attr("dy", getDy)
        .attr("dx",getDx)
        .text((d) => d.node);

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
    description: string;
}

type TreeHierarchy = {
    name: string;
    children: TreeData[];
    description: string;
    layer: number;
}

type TreeLink = {
    source:  d3.HierarchyRectangularNode<TreeHierarchy>,
    target:  d3.HierarchyRectangularNode<TreeHierarchy>,
    count: number
}
const getTreeData = (
    architecture: Architecture,
    chartData: ChartData,
    svgWidth: number,
    svgHeight: number,
    margin: { [key: string]: number },
    padding: number,
    direction: string
) => {


    const treeData = architecture.layers.reduce((acc, entry) => {
        const networkData = chartData.networks.find((f) => f.id === entry.network);
        acc.push({
            layer: entry.layer,
            name: entry.network,
            description: networkData?.data.network_desc || "",
            value: networkData?.data.nodes?.length || 0
        })
        return acc;
    },[] as TreeData[])

    const hierarchy = d3.hierarchy<TreeHierarchy>({name: "root", children: treeData, description: "", layer: -1});

    hierarchy.count();


    const tree = d3.treemap<TreeHierarchy>()
        .tile(direction === "horizontal" ? d3.treemapDice : d3.treemapSlice)
        .size([svgWidth - margin.left - margin.right, svgHeight - margin.top - margin.bottom])
        .round(true)
        .padding(padding);

    const treeChartData: HierarchyRectangularNode<TreeHierarchy>[] = tree(hierarchy).descendants();

    const layerData: {layer: number, x: number, y: number}[] = [];
    const groupedTreeData =  Array.from(d3.group(treeChartData, (d) => d.data.layer))
        .filter((f) => f[0] >= 0)
        .reduce((acc, entry) => {
            const firstEntry = entry[1][0];
            if(entry[1].length === 1) {
                if(direction === "horizontal"){
                    firstEntry.y0 = firstEntry.y0 - padding;
                    firstEntry.y1 = firstEntry.y1 + padding;
                } else {
                    firstEntry.x0 = firstEntry.x0 - padding;
                    firstEntry.x1 = firstEntry.x1 + padding;
                }
                acc.push(firstEntry)
            } else {
                if(direction === "horizontal"){
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
                } else {
                    const yMin = d3.min(entry[1], (d) => d.y0);
                    const yMax = d3.max(entry[1], (d) => d.y1);
                    const width = firstEntry.x1 - firstEntry.x0;
                    const entryWidth = (width - (entry[1].length - 1 * padding))/entry[1].length;
                    entry[1].map((m,i) => {
                        m.y0 = yMin || m.y0;
                        m.y1 = yMax || m.y1;
                        m.x0 = i * (entryWidth + padding);
                        m.x1 = entryWidth + (i * (entryWidth + padding))
                    })
                }
                acc = acc.concat(entry[1]);
            }
            layerData.push({
                layer: entry[0],
                x: direction === "horizontal" ? firstEntry.x0 + (firstEntry.x1 - firstEntry.x0)/2 : 0,
                y: direction === "horizontal" ? 0 : firstEntry.y0 + (firstEntry.y1 - firstEntry.y0)/2
            })
            return acc;
        },[] as HierarchyRectangularNode<TreeHierarchy>[])
        return {groupedTreeData, layerData};
    ;
}
export const drawGroupTree = (
    baseSvg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>,
    architecture: Architecture,
    chartData: ChartData,
    svgWidth: number,
    svgHeight: number,
    clearChart: boolean,
    direction: string,
    containerClass: string
) => {


    const marginHorizontal = {top: 70,left:20, right:20, bottom: 20};
    const marginVertical = {top: 20,left:140, right:20, bottom: 20};
    const margin = direction === "horizontal" ? marginHorizontal : marginVertical
    const padding = 40;
    const {groupedTreeData, layerData} =  getTreeData(architecture,chartData,svgWidth,svgHeight,margin, padding,direction);
    const treeData = clearChart ? []: groupedTreeData;
    const treeLinks = clearChart ? [] : architecture.routes.reduce((acc, entry) => {
        const matchingLink = acc.find((f) => f.source.data.name === entry.source_net && f.target.data.name === entry.dest_net);
        if(!matchingLink){
            const source = groupedTreeData.find((f) => f.data.name === entry.source_net);
            const target = groupedTreeData.find((f) => f.data.name === entry.dest_net);
            if(source && target){
                acc.push({
                    source,
                    target,
                    count: 1
                })
            }
        } else {
            matchingLink.count += 1
        }
        return acc
    },[] as TreeLink[])


    const layersGroup = baseSvg
        .selectAll<SVGGElement,{layer: number, x:number, y: number}[]>(".layersGroup")
        .data(clearChart ? [] : layerData)
        .join((group) => {
            const enter = group.append("g").attr("class", "layersGroup");
            enter.append("text").attr("class", "layerLabel");
            return enter;
        });

    layersGroup.attr("transform", d => `translate(${margin.left },${margin.top  + (direction === "horizontal" ? -20 : 6)})`)

    layersGroup.select(".layerLabel")
        .attr("x", (d) => d.x - (direction === "horizontal" ? 0 : 20))
        .attr("y", (d) => d.y )
        .attr("text-anchor",direction === "horizontal" ? "middle" : "end")
        .attr("font-size",20)
        .text((d) => `Layer ${d.layer}`);

    const nodesGroup = baseSvg
        .selectAll<SVGGElement,HierarchyRectangularNode<TreeHierarchy>>(".treeNodeGroup")
        .data(treeData)
        .join((group) => {
            const enter = group.append("g").attr("class", "treeNodeGroup");
            enter.append("rect").attr("class", "treeRect");
            enter.append("text").attr("class", "treeRectLabel");
            return enter;
        });

    nodesGroup.attr("transform", d => `translate(${margin.left + d.x0},${margin.top + d.y0})`)

    nodesGroup.select(".treeRectLabel")
        .attr("pointer-events","none")
        .attr("x",8)
        .attr("y",16)
        .attr("fill",(d) => d.depth === 1 ? "#484848" : "white")
        .attr("font-size",12)
        .text((d) =>  `${d.data.description} (${d.data.name})`)

    nodesGroup.select(".treeRect")
        .attr("rx",2)
        .attr("ry",2)
        .attr("width",(d) => d.x1 - d.x0)
        .attr("height", (d) => d.y1 - d.y0)
        .attr("stroke-width",(d) => d.depth === 2 ? 0 : 1.5)
        .attr("stroke","#484848")
        .attr("fill","white");

    const getLayerPath = (d: TreeLink) => {
        const linkPadding = 1.5;
        if(direction === "horizontal"){
            const sourceHeight = d.source.y1 - d.source.y0;
            const targetHeight = d.target.y1 - d.target.y0;
            return `M${d.source.x1 + linkPadding},${d.source.y0 + sourceHeight/2} L${d.target.x0 - linkPadding},${d.target.y0 + targetHeight/2}`
        }
        const sourceWidth = d.source.x1 - d.source.x0;
        const targetWidth = d.target.x1 - d.target.x0;
        return `M${d.source.x0 + sourceWidth/2},${d.source.y1 + linkPadding} L${d.target.x0 + targetWidth/2},${d.target.y0 - linkPadding}`

    }

    const linksGroup = baseSvg
        .selectAll<SVGGElement,{layer: number, x:number, y: number}[]>(".linksGroup")
        .data(treeLinks)
        .join((group) => {
            const enter = group.append("g").attr("class", "linksGroup");
            enter.append("path").attr("class", "layerLink");
            return enter;
        });

    linksGroup.attr("transform", d => `translate(${margin.left },${margin.top})`);

    linksGroup.select(".layerLink")
        .attr("stroke-width", 1.5)
        .attr("stroke","#D0D0D0")
        .attr("marker-start",(d) => d.source.data.layer < d.target.data.layer ? "" : `url(#arrowStart${containerClass})`)
        .attr("marker-end",(d) => d.source.data.layer < d.target.data.layer ? `url(#arrowEnd${containerClass})` : "")
        .attr("d",  getLayerPath)




}
