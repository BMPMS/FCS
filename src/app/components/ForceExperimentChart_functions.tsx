import * as d3 from "d3";
import {
    Architecture,
    ChartData,
    ChartLink,
    ChartNode,
    HierarchyLink,
    HierarchyNode
} from "@/app/components/ForceExperimentChart_types";
import {
    CIRCLE_RADIUS,
    COLORS,
    NODEFLOW_COLORS,
    NODETYPE_ICONS
} from "@/app/components/ForceExperimentChart";
import {HierarchyRectangularNode} from "d3";
import Graph from 'graphology';
import {Attributes} from 'graphology-types'
const getAllConnectedNodes = (
    graph:  Graph<Attributes, Attributes, Attributes>,
    nodeId: string,
    direction = 'descendants',
    visited = new Set()) => {
    visited.add(nodeId);

    // Choose neighbors based on direction
    const neighbors =
        direction === 'descendants'
            ? graph.outNeighbors(nodeId)
            : direction === 'ancestors'
                ? graph.inNeighbors(nodeId)
                : [];

    neighbors.forEach(neighbor => {
        getAllConnectedNodes(graph, neighbor, direction, visited);
    });

    return visited;
}
const getNodeChain = (nodeId: string, nodes: ChartNode[],links: ChartLink[]) => {
    const graph = new Graph();
    nodes.forEach((node) => graph.addNode(node.id));
    links.forEach((link) => graph.addEdge(getLinkId(link,"source"), getLinkId(link,"target")));
    const allNodes = new Set();
    getAllConnectedNodes(graph,nodeId,"descendants",allNodes);
    getAllConnectedNodes(graph,nodeId,"ancestors",allNodes);
    return Array.from(allNodes) as string[];
}
const getHierarchyNodeChain = (nodeId: string, nodes: d3.HierarchyNode<HierarchyNode>[],links: HierarchyLink[]) => {
    const graph = new Graph();
    nodes.forEach((node) => graph.addNode(node.data.name));
    links.forEach((link) => graph.addEdge(getLinkId(link,"source"), getLinkId(link,"target")));
    const allNodes = new Set();
    getAllConnectedNodes(graph,nodeId,"descendants",allNodes);
    getAllConnectedNodes(graph,nodeId,"ancestors",allNodes);
    return Array.from(allNodes) as string[];
}

export const measureWidth = (text: string, fontSize: number) => {
    const context = document.createElement("canvas").getContext("2d");
    if(context){
        context.font = `${fontSize}px Arial`;
        return context.measureText(text).width;
    }
    return 0;
}

export const getLinkId = (link: ChartLink | HierarchyLink , direction: "source" | "target") => {
    const node = link[direction];
    if(typeof node === "string") return node;
    if (node.id) return  node.id;
    if ('data' in node) {
        return node.data.name
    }
    return "" // shouldn't happen
 }


const switchArrowDefs = (
    baseSvg: d3.Selection<HTMLElement, unknown,null, undefined>,
        containerClass: string,
        radius: number) => {
    const markerWidthHeight =  Math.max(radius + 8, 8);
    baseSvg.select(`#arrowNodeStart${containerClass}`)
        .attr("markerWidth",markerWidthHeight)
        .attr("markerHeight", markerWidthHeight)
        .attr("refX", -9 + radius);

    baseSvg.select(`#arrowNodeEnd${containerClass}`)
        .attr("markerWidth", markerWidthHeight)
        .attr("markerHeight", markerWidthHeight)
        .attr("refX", 11.5 + radius);

}

export const drawArrowDefs = (baseSvg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>, containerClass: string) => {
    const arrowFill = "#A0A0A0";

    baseSvg.select(`#arrowStart${containerClass}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", -5 + CIRCLE_RADIUS)
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
        .attr("refX", -2 + CIRCLE_RADIUS)
        .attr("markerWidth", 8)
        .attr("markerHeight", 8)
        .attr("orient", "auto");

    baseSvg.select(`#arrowPathEnd`)
        .attr("fill", arrowFill)
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("d", "M1, -4L9,0L1,4");

    baseSvg.select(`#arrowNodeStart${containerClass}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("orient", "auto");

    baseSvg.select(`#arrowNodePathStart`)
        .attr("fill", arrowFill)
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("d", "M9,-4L1,0L9,4");

    baseSvg.select(`#arrowNodeEnd${containerClass}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("orient", "auto");

    baseSvg.select(`#arrowNodePathEnd`)
        .attr("fill", arrowFill)
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("d", "M1, -4L9,0L1,4");

}

export const drawLegend = (
    baseSvg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>

) => {
    baseSvg.select(".legendGroup")

    const iconSize = 12;
    let iconX = 0;

    const iconLegendData = Object.keys(NODETYPE_ICONS).reduce((acc, key) => {
        acc.push({
            x: iconX,
            label: key,
            icon: NODETYPE_ICONS[key as keyof typeof NODETYPE_ICONS]
        })
        iconX += (iconSize + 15 + measureWidth(key,iconSize))
        return acc;
    },[] as any);


    // final group - lineDotsMetricGroup - with the dots
    const iconLegendGroup =  baseSvg.select(".legendGroup")
        .selectAll(".iconsGroup")
        .data(iconLegendData)
        .join((group) => {
            const enter = group.append("g").attr("class", "iconsGroup");
            enter.append("text").attr("class", "fa legendIcon");
            enter.append("text").attr("class", "legendIconLabel");
            return enter;
        });

    iconLegendGroup.attr("transform", (d: any) => `translate(${d.x},6)`)

    iconLegendGroup.select(".legendIcon")
        .attr("font-size", iconSize)
        .attr("fill", "#484848")
        .attr("text-anchor","middle")
        .style("dominant-baseline","middle")
        .text((d: any) => d.icon);

    iconLegendGroup.select(".legendIconLabel")
        .attr("x",  iconSize * 0.8)
        .attr("font-size", iconSize)
        .attr("fill", "#484848")
        .style("dominant-baseline","middle")
        .text((d: any) => d.label);


    const circleRadius = 4;
    let colorX = 0;

    const colorLegendData = Object.keys(NODEFLOW_COLORS).reduce((acc, key) => {
        acc.push({
            x: colorX,
            label: key,
            fill: NODEFLOW_COLORS[key as keyof typeof NODEFLOW_COLORS]
        })
        colorX += ((circleRadius * 2) + 18 + measureWidth(key,iconSize))
        return acc;
    },[] as any);

    // final group - lineDotsMetricGroup - with the dots
    const colorLegendGroup =  baseSvg.select(".legendGroup")
        .selectAll(".colorsGroup")
        .data(colorLegendData)
        .join((group) => {
            const enter = group.append("g").attr("class", "colorsGroup");
            enter.append("circle").attr("class", "legendColorCircle");
            enter.append("text").attr("class", "legendColorLabel");
            return enter;
        });

    colorLegendGroup.attr("transform", (d: any) => `translate(${d.x},25)`)

    colorLegendGroup.select(".legendColorCircle")
        .attr("r",circleRadius)
        .attr("fill", (d: any) => d.fill)
        ;

    colorLegendGroup.select(".legendColorLabel")
        .attr("x",  circleRadius * 2.4)
        .attr("font-size", iconSize)
        .attr("fill", (d: any) => d.fill)
        .style("dominant-baseline","middle")
        .text((d: any) => d.label);




}
export const drawRadioButtons = (
    svg: d3.Selection<d3.BaseType, unknown, HTMLElement, unknown>,
    data: string[],
    currentNetwork: string,
    radioButtonChange: (newNetwork: string) => void) => {

    if(!data.some((s) => s === "All")){
        data.push("All");
    }

    // final group - lineDotsMetricGroup - with the dots
    const networkGroup =  d3.select("#networkRadioGroup")
        .selectAll(".radioDiv")
        .data( data)
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

const getNodeCircleFill = (node: ChartNode, links: ChartLink[] | HierarchyLink[]) => {
    if(node.class !== "output") return NODEFLOW_COLORS[node.class as keyof typeof NODEFLOW_COLORS];
    const suppressionInputLinks = links.some((f) => getLinkId(f,"target") === node.id && f.type === "suppress");
    return suppressionInputLinks ? NODEFLOW_COLORS["failedOutput"] : NODEFLOW_COLORS["successfulOutput"];
}
const getNodeDisplay = (d: ChartNode, nodeSelection: string[]) => {
    if(nodeSelection.includes(d.id)){
        return "block"
    }
    return "none"
}
export const resetNodeAppearance =  (
    svg:d3.Selection<d3.BaseType , unknown, HTMLElement, unknown>,
    selectedNodes:string[]) => {
    svg.selectAll<SVGTextElement | SVGRectElement, ChartNode>(".nodeLabelItem")
        .attr("display",(n) => getNodeDisplay(n,selectedNodes));

    svg.selectAll<SVGCircleElement,ChartNode>(".nodeCircle")
        .attr("stroke", (n) => selectedNodes.includes(n.node) ? COLORS.darkblue : NODEFLOW_COLORS[n.class as keyof typeof NODEFLOW_COLORS])

}
export const drawForce = (
    svg: d3.Selection<d3.BaseType, unknown, HTMLElement, unknown>,
    nodes: ChartNode[],
    links: ChartLink[],
    simulation:  d3.Simulation<d3.SimulationNodeDatum, undefined>,
    direction: string,
    selectedNodes:  React.RefObject<string[]>,
    containerClass: string,
    callZoomToBounds: (currentNodes: ChartNode[]) => void
) => {




    const getLinkOpacity = (d: ChartLink, linkSelection: number[], isMouseover: boolean) => {
        if(selectedNodes.current.length > 0 || linkSelection.length === 0 && !isMouseover) return 1;

        if(linkSelection.length > 0 && d.index && linkSelection.includes(d.index)){
            return 1;
        }
        const selectedLinkIds = links
            .filter((f) => selectedNodes.current.includes(getLinkId(f,"source")) &&
                selectedNodes.current.includes(getLinkId(f,"target")))
            .map((m) => m.index || -1);
        if(selectedLinkIds.length > 0 && d.index && selectedLinkIds.includes(d.index)){
            return 1;
        }
        return 0.2;
    }

    const getNodeOpacity = (d: ChartNode, nodeSelection: string[], isMouseover: boolean) => {
        if(selectedNodes.current.length === 0 && !isMouseover) return 1;
        if(nodeSelection.includes(d.id)){
            return 1;
        }
        return 0.4;
    }


    const redrawChart = () => {

        const chartNodes = selectedNodes.current.length === 0 ? nodes : nodes.filter((f) => selectedNodes.current.includes(f.id))

        chartNodes.forEach((d) => {
            d.fx = undefined;
            d.fy = undefined;
        })
        const chartLinks = selectedNodes.current.length === 0 ? links : links.filter((f) =>
            selectedNodes.current.some((s) => getLinkId(f,"source") === s) &&
            selectedNodes.current.some((s) => getLinkId(f,"target") === s)
        )
        let circleRadius = CIRCLE_RADIUS;
        const depthGroup = d3.group(chartNodes, (d) => `${d.nodeDepth}${d.network ? d.network : ""}` );
        if(nodes.some((s) => s.network)){
            const maxSpace = Math.min(...[...depthGroup.values()].map(arr => {
                const firstEntry = arr[0];
                if(firstEntry && firstEntry.bounds){
                    const networkNodes = chartNodes.filter((f) => f.network === firstEntry.network);
                    const maxDepth = d3.max(networkNodes, (m) => m.nodeDepth);
                    if(maxDepth){
                        const minWidth = firstEntry.bounds.widthOrHeight/arr.length;
                        const minHeight = firstEntry.bounds.opposite/(maxDepth + 1.5);
                        return Math.min(minWidth,minHeight);
                    }
                }
                return CIRCLE_RADIUS * 2;
            }))
            circleRadius = Math.min(maxSpace/2 - 2,CIRCLE_RADIUS);
        }
        const circleDiameter = circleRadius * 2;

        depthGroup.forEach((value) => {
            const valueLength = value.length;
            let circleGap = value.length > 10 ? circleRadius * 6 : circleRadius * 15;
            const firstEntry = value[0];
            if(firstEntry && firstEntry.bounds){
                const boundWidth = firstEntry.bounds.widthOrHeight - (circleDiameter * 1.5);
                const remainderWidth = boundWidth - (circleDiameter * valueLength);
                circleGap = circleDiameter + (remainderWidth/valueLength);
            }
            value.map((m,i) => {
                m.oppositePos =   ((i + 0.5) * circleGap);
                m.extraX = firstEntry.bounds ? firstEntry.bounds.x : 0;
                m.extraY = firstEntry.bounds ? firstEntry.bounds.top  : 0;
            })
        });

        const svgNode = svg.node() as SVGSVGElement | undefined;
        const baseSvgNode = svgNode?.parentElement;
        if(baseSvgNode){
            const baseSvg = d3.select(baseSvgNode);
            switchArrowDefs(baseSvg,containerClass,circleRadius);
            baseSvg.on("click",(event) => {
                if(event.target.tagName === "svg"){
                    selectedNodes.current = [];
                    redrawChart()
                }
            })
        }
        // links group (just a line but you could add labels etc.)
        const linksGroup = svg
            .select(".linkGroup")
            .selectAll(".linksGroup")
            .data(chartLinks)
            .join((group) => {
                const enter = group.append("g").attr("class", "linksGroup");
                enter.append("path").attr("class", "linkLine");
                return enter;
            });

        linksGroup
            .select(".linkLine")
            .attr("pointer-events","none")
            .attr("stroke-width", 0.5)
            .attr("stroke",  (d) => d.type === "architecture" ? "#D0D0D0": "#808080")
            .attr("stroke-dasharray", (d)=>  d.type === "suppress" ? "4,2" :"")
            .attr("opacity", (d) => getLinkOpacity(d, [],false));


        const maxDepth = d3.max(nodes, (d) => d.nodeDepth) || 0;
        // nodes group (just a circle but you could add labels etc.)
        const nodesGroup = svg
            .select(".nodeGroup")
            .selectAll<SVGGElement,ChartNode[]>(".nodesGroup")
            .data(chartNodes)
            .join((group) => {
                const enter = group.append("g").attr("class", "nodesGroup");
                enter.append("circle").attr("class", "nodeBackgroundCircle");
                enter.append("circle").attr("class", "nodeCircle");
                enter.append("text").attr("class", "fa fa-strong nodeCircleIcon");
                enter.append("rect").attr("class", "nodeLabelItem nodeLabelRect");
                enter.append("text").attr("class", "nodeLabelItem nodeLabel");
                return enter;
            });

        nodesGroup
            .on("mouseover", (event, d) => {

                const matchingLinks = links.filter((f) => getLinkId(f,"source") === d.id || getLinkId(f,"target") === d.id);
                const linkIndices = matchingLinks.map((m) => m.index || -1);
                const oppositeNodeIds = matchingLinks.map((m) => getLinkId(m,"source") === d.id ? getLinkId(m, "target") : getLinkId(m,"source"))
                 const tempSelected = selectedNodes.current.concat([d.id]).concat(oppositeNodeIds);
                svg.selectAll<SVGTextElement | SVGRectElement, ChartNode>(".nodeLabelItem")
                    .attr("display", (n) => getNodeDisplay(n,tempSelected));
                svg.selectAll<SVGTextElement | SVGRectElement, ChartNode>(".nodeCircle")
                    .attr("opacity", (n) => getNodeOpacity(n,tempSelected,true));
                 svg.selectAll<SVGLineElement,ChartLink>(".linkLine")
                     .attr("opacity", (l) => getLinkOpacity(l, linkIndices,true));
                d3.select(event.currentTarget).raise();
            })
            .on("mouseout", () => {
                svg.selectAll<SVGTextElement | SVGRectElement, ChartNode>(".nodeLabelItem")
                    .attr("display",(n) => getNodeDisplay(n,selectedNodes.current));
                svg.selectAll<SVGTextElement | SVGRectElement, ChartNode>(".nodeCircle")
                    .attr("opacity", (n) => getNodeOpacity(n,selectedNodes.current,false));
                svg.selectAll<SVGLineElement, ChartLink>(".linkLine")
                    .attr("opacity", (l) => getLinkOpacity(l, [],false))
            })
            .on("click", (event, d) => {
                if(selectedNodes.current.includes(d.id)){
                    selectedNodes.current = [];
                } else {
                    const nodeChain= getNodeChain(d.id,nodes,links);
                    selectedNodes.current = nodeChain;
                }

                redrawChart();
                //resetNodeAppearance(svg,selectedNodes.current);
            })

        const dragstarted = () => {
            chartNodes.forEach((d) => {
                d.fx = d.x;
                d.fy = d.y;
            })
            simulation.stop();
            simulation.alphaTarget(0.1).restart();
        };

        const dragged = (
            event: d3.D3DragEvent<SVGGElement, ChartNode, ChartNode> | d3.SubjectPosition,
            d: ChartNode,
        ) => {
            d.fx = event.x;
            d.fy = event.y;
        };

        nodesGroup.call(
            d3
                .drag<SVGGElement, ChartNode>()
                .on('start', dragstarted)
                .on('drag', dragged),
        );


        nodesGroup
            .select(".nodeBackgroundCircle")
            .attr("r", circleRadius)
            .attr("fill", "var(--background)")


        nodesGroup
            .select(".nodeCircle")
            .attr("r", circleRadius)
            .attr("fill",(d) => getNodeCircleFill(d, links))
            .attr("stroke-width",1.5)
            .attr("stroke", (d) => selectedNodes.current.includes(d.id) ? COLORS.darkblue : getNodeCircleFill(d,links))
            .attr("opacity", (d) => getNodeOpacity(d,selectedNodes.current, false));

        nodesGroup
            .select(".nodeCircleIcon")
            .attr("font-size", circleRadius * 1.3)
            .attr("fill", "white")
            .attr("text-anchor","middle")
            .style("dominant-baseline","middle")
            .attr("opacity", (d) => getNodeOpacity(d,selectedNodes.current, false))
           // .attr("transform",direction === "horizontal" ? "rotate(90)" : "")
            .text((d) => NODETYPE_ICONS[d.type as keyof typeof NODETYPE_ICONS]);


        const getTextAnchor = (d: ChartNode) => {
            if(direction === "vertical"){
                if(d.nodeDepth <= maxDepth/2) return "end";
                if(d.nodeDepth > maxDepth/2) return "start";
            }
            return "middle";
        }

        const getDy = (d: ChartNode) => {
                if(d.nodeDepth <= maxDepth/2) return -(circleRadius * 1.5);
                if(d.nodeDepth > maxDepth/2) return circleRadius * 2.3;

            return 2;
        }

        const getDx = (d: ChartNode) => {
            if(direction === "vertical"){
                if(d.nodeDepth <= maxDepth/2) return -(circleRadius + 2);
                if(d.nodeDepth > maxDepth/2) return circleRadius + 2;
            }
            return 0;
        }

        nodesGroup.select(".nodeLabelRect")
            .attr("pointer-events","none")
            .attr("display",(d) => getNodeDisplay(d, selectedNodes.current))
            .attr("rx",2)
            .attr("ry",2)
            .attr("width", (d) => measureWidth(d.node, 6.5))
            .attr("height", 6)
            .attr("x", (d) => {
                const dx = getDx(d);
                const textAnchor = getTextAnchor(d);
                const rectWidth = measureWidth(d.node, 6.5);
                if(textAnchor === "middle") return dx - rectWidth/2;
                if(textAnchor === "end") return dx - rectWidth;
                return dx;
            })
            .attr("y", (d) => getDy(d) - 5)
            .attr("fill","var(--background)")

        nodesGroup
            .select(".nodeLabel")
            .attr("pointer-events","none")
            .attr("display",(d) => getNodeDisplay(d, selectedNodes.current))
            .attr("text-anchor",getTextAnchor)
            .attr("font-size",6)
            .attr("dy", getDy)
            .attr("dx",getDx)
            .text((d) => d.node);

        // as the simulation ticks, reposition links and node groups
        simulation.on("tick", () => {
            svg
                .selectAll<SVGLineElement,ChartLink>(".linkLine")
                .attr("d", (d) => {
                    const source = (d.source as ChartNode);
                    const {x: sourceX, y: sourceY, extraX: sourceExtraX, extraY: sourceExtraY} = source;
                    const target =  (d.target as ChartNode);
                    const {x: targetX, y: targetY,extraX: targetExtraX, extraY: targetExtraY} = target;
                    if(!sourceX || !sourceY || !targetX || !targetY) return ""
                    return `M${sourceX + sourceExtraX},${sourceY + sourceExtraY} L${targetX + targetExtraX},${targetY + targetExtraY}`;
                })

            svg.selectAll<SVGGElement,ChartNode>(".nodesGroup")
                .attr("transform", (d) => `translate(${(d.x || 0) + d.extraX},${(d.y || 0) + d.extraY})`);
        });

        // reset the simulation
        simulation.nodes([]);
        simulation.nodes(chartNodes);
        const linkForce = simulation.force("link");
        if(linkForce){
            (linkForce as d3.ForceLink<ChartNode,ChartLink>).links([]);
            (linkForce as d3.ForceLink<ChartNode,ChartLink>).links(chartLinks);
        }
        ;

        simulation.stop();
        simulation.alpha(1).restart();
        simulation.tick(500);
        if(!nodes.some((s) => s.network)){
            callZoomToBounds(chartNodes);
        }
    }

    redrawChart();

    const getMarker = (d: ChartLink, direction: string) => {
        if(typeof d.source === "string" || typeof d.target === "string") return "";
        if(direction === "start"){
            if(d.source.nodeDepth > d.target.nodeDepth) return `url(#arrowNodeStart${containerClass})`
        }
        if(direction === "end"){
            if(d.source.nodeDepth < d.target.nodeDepth) return `url(#arrowNodeEnd${containerClass})`
        }
        return ""
    }

    svg.selectAll<SVGPathElement,ChartLink>(".linkLine")
        .attr("marker-start", (d) => getMarker(d,"start"))
        .attr("marker-end", (d) => getMarker(d,"end"))


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
    if (xExtent0 !== undefined && xExtent1 !== undefined && yExtent0 !== undefined && yExtent1 !== undefined) {
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
                    .scale(fitToScale)
                    .translate(translateX,translateY)
                    // .scale(fitToScale > 1 ? 1 : fitToScale)
                 //   .translate(fitToScale > 1 ? -width/2 : translateX, fitToScale > 1 ? -height/2 : translateY),
            );
    }
}

type TreeData = {
    layer: number;
    name: string;
    value: number;
    description: string;
    nodes: ChartNode[];
}

type TreeHierarchy = {
    name: string;
    children: TreeData[];
    description: string;
    layer: number;
    nodes: ChartNode[];
    value: number;
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
        const nodes = networkData? networkData.data.nodes : [];
        const maxDepth = d3.max(nodes, (m) => m.nodeDepth)
        if(maxDepth){
            acc.push({
                layer: entry.layer,
                name: entry.network,
                description: networkData?.data.network_desc || "",
                value: nodes.length * maxDepth || 0,
                nodes
            })
        }
        return acc;
    },[] as TreeData[])


    const hierarchy = d3.hierarchy<TreeHierarchy>({
        name: "root",
        children: treeData,
        description: "",
        layer: -1,
        nodes: [],
    value: 0});


    hierarchy.sum((d) => d.value);

    const tree = d3.treemap<TreeHierarchy>()
        .tile(direction === "vertical" ? d3.treemapDice : d3.treemapSlice)
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
                if(direction === "vertical"){
                    firstEntry.y0 = firstEntry.y0 - padding;
                    firstEntry.y1 = firstEntry.y1 + padding;
                } else {
                    firstEntry.x0 = firstEntry.x0 - padding;
                    firstEntry.x1 = firstEntry.x1 + padding;
                }
                acc.push(firstEntry)
            } else {
                if(direction === "vertical"){
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
                x: direction === "vertical" ? firstEntry.x0 + (firstEntry.x1 - firstEntry.x0)/2 : 0,
                y: direction === "vertical" ? 0 : firstEntry.y0 + (firstEntry.y1 - firstEntry.y0)/2
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
    containerClass: string,
    simulation:  d3.Simulation<d3.SimulationNodeDatum, undefined>,
    selectedNodes:  React.RefObject<string[]>,
    resetCurrentNodes: (nodeNames: string[]) => void,
    callZoomToBounds: (currentNodes: ChartNode[]) => void

) => {


    const marginHorizontal = {top: 80,left:10, right:10, bottom: 25};
    const marginVertical = {top: 40,left:100, right:10, bottom: 25};
    const margin = direction === "vertical" ? marginHorizontal : marginVertical
    const padding = 20;
    const {groupedTreeData, layerData} =  getTreeData(architecture,chartData,svgWidth,svgHeight,margin, padding,direction);
    const treeData: HierarchyRectangularNode<TreeHierarchy>[] = clearChart ? []: groupedTreeData;
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


    const layersGroup = baseSvg.select(".treeGroup")
        .selectAll<SVGGElement,{layer: number, x:number, y: number}[]>(".layersGroup")
        .data(clearChart ? [] : layerData)
        .join((group) => {
            const enter = group.append("g").attr("class", "layersGroup");
            enter.append("text").attr("class", "layerLabel");
            return enter;
        });

    layersGroup.attr("transform",  `translate(${margin.left },${margin.top  + (direction === "vertical" ? -22 : 6)})`)

    layersGroup.select(".layerLabel")
        .attr("x", (d) => d.x - (direction === "vertical" ? 0 : 20))
        .attr("y", (d) => d.y )
        .attr("text-anchor",direction === "vertical" ? "middle" : "end")
        .attr("font-size",20)
        .text((d) => `Layer ${d.layer}`);

    const nodesGroup = baseSvg.select(".treeGroup")
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
        .attr("text-anchor","end")
        .attr("transform", direction === "horizontal"? "translate(-5,0) rotate(-90)" : "translate(8,-6)")
        .attr("fill",(d) => d.depth === 1 ? "#484848" : "white")
        .attr("font-size",18)
        .attr("font-weight","bold")
        .text((d) =>  `${d.data.name}`)

    nodesGroup.select(".treeRect")
        .attr("rx",2)
        .attr("ry",2)
        .attr("width",(d) => d.x1 - d.x0)
        .attr("height", (d) => d.y1 - d.y0)
        .attr("stroke-width",(d) => d.depth === 2 ? 0 : 1.5)
        .attr("stroke","#484848")
        .attr("fill","none");

    const getLayerPath = (d: TreeLink) => {
        const linkPadding = 1.5;
        if(direction === "vertical"){
            const sourceHeight = d.source.y1 - d.source.y0;
            const targetHeight = d.target.y1 - d.target.y0;
            return `M${d.source.x1 + linkPadding},${d.source.y0 + sourceHeight/2} L${d.target.x0 - linkPadding},${d.target.y0 + targetHeight/2}`
        }
        const sourceWidth = d.source.x1 - d.source.x0;
        const targetWidth = d.target.x1 - d.target.x0;
        return `M${d.source.x0 + sourceWidth/2},${d.source.y1 + linkPadding} L${d.target.x0 + targetWidth/2},${d.target.y0 - linkPadding}`

    }

    const linksGroup = baseSvg.select(".treeGroup")
        .selectAll<SVGGElement,{layer: number, x:number, y: number}[]>(".treeLinksGroup")
        .data(treeLinks)
        .join((group) => {
            const enter = group.append("g").attr("class", "treeLinksGroup");
          //  enter.append("path").attr("class", "layerLink");
            return enter;
        });

    linksGroup.attr("transform",  `translate(${margin.left },${margin.top})`);

    linksGroup.select(".layerLink")
        .attr("stroke-width", 1.5)
        .attr("stroke","#D0D0D0")
     //   .attr("marker-start",(d) => d.source.data.layer < d.target.data.layer ? "" : `url(#arrowStart${containerClass})`)
     //   .attr("marker-end",(d) => d.source.data.layer < d.target.data.layer ? `url(#arrowEnd${containerClass})` : "")
        .attr("d",  getLayerPath)

    // loop through networks and assign bounds + precisionTreeScale
    const treeForceData = treeData.reduce((acc, entry) => {
        const scaleRange = [
            (direction === "horizontal" ? entry.y0 : entry.x0) + (CIRCLE_RADIUS * 2.5),
            (direction === "horizontal" ? entry.y1 : entry.x1) - (CIRCLE_RADIUS * 2.5)];
        let {0:depthExtent0, 1: depthExtent1} = d3.extent(entry.data.nodes, (d) => d.nodeDepth);
        depthExtent0 = depthExtent0 === undefined ? 0 : depthExtent0;
        depthExtent1 = depthExtent1 === undefined ? 0 : depthExtent1;
        const treePositionScale = d3.scaleLinear()
            .domain([depthExtent0, depthExtent1])
            .range(scaleRange);


        const bounds = {
            x: direction === "horizontal" ? entry.x0 + margin.left : margin.left,
            widthOrHeight: direction === "horizontal" ? entry.x1 - entry.x0 : entry.y1 - entry.y0,
            opposite: direction === "horizontal" ? entry.y1 - entry.y0 : entry.x1 - entry.x0,
            top: direction === "horizontal" ? margin.top : entry.y0 + margin.top}
        const networkNodes = entry.data.nodes.reduce((nodeAcc, node) => {
            nodeAcc.push({
                id: node.id,
                node:node.node,
                type: node.type,
                class: node.class,
                desc: node.desc,
                nodeDepth: node.nodeDepth,
                network: entry.data.name,
                extraX: 0,
                extraY: 0,
                bounds,
                treePositionScale
            })
            return nodeAcc;
        }, [] as ChartNode[]);
        if(!acc.nodes){acc.nodes = []};
        if(!acc.links){acc.links = []};
        acc.nodes = acc.nodes.concat(networkNodes);
        const links = chartData.networks.find((f) => f.id === entry.data.name)?.data.links;
        if(links){
            links.forEach((link) => {
                const source = getLinkId(link, "source");
                const target = getLinkId(link,"target");
                acc.links.push({
                    source,
                    target,
                    type: link.type
                })
            })
        }
        return acc;
    },{} as {nodes: ChartNode[],links:ChartLink[]})
    if(!clearChart){
        resetCurrentNodes(treeForceData.nodes.map((m) => m.node));
        architecture.routes.forEach((route) => {
            const source = `${route.source_node}-${route.source_net}`;
            const target = `${route.dest_node}-${route.dest_net}`;
            const identicalLink = treeForceData.links.find((f) => getLinkId(f,"source") === source && getLinkId(f,"target") === target);
            const oppositeLink = treeForceData.links.find((f) => getLinkId(f,"source") === target && getLinkId(f,"target") === source);
            if(!identicalLink){
                if(oppositeLink){
                    console.log('we have an opposite')
                } else {
                    const existingSourceNode = treeForceData.nodes.some((s) => s.id === source);
                    const existingTargetNode = treeForceData.nodes.some((s) => s.id === target);
                    if(existingSourceNode && existingTargetNode){
                        treeForceData.links.push({source,target,type:"architecture"})
                    } else {
                        console.log(existingSourceNode,source, existingTargetNode, target);
                    }
                }
            }
        })
        drawForce(baseSvg.select(".chartSvg"),treeForceData.nodes,treeForceData.links,simulation,direction,selectedNodes,containerClass, callZoomToBounds)
    }

}


const getLinearHierarchy = (
    architecture: Architecture,
    chartData: ChartData,
) => {


    const allLinks: ChartLink[] = [];

    const addLinkIfNotThere = (sourceId: string, targetId: string, linkType: string) => {
        const matchingLink = allLinks.find((f) =>
            (f.source === sourceId && f.target === targetId) || (f.target === sourceId && f.source === targetId));
        if(!matchingLink){
            allLinks.push({
                source: sourceId,
                target: targetId,
                type: linkType
            })
        }
    }
    const hierarchyChildren = Array.from(d3.group(architecture.layers, (g) => g.layer)).reduce((acc, entry) => {
        const networkChildren = entry[1].reduce((networkAcc, network) => {
            const networkData = chartData.networks.find((f) => f.id === network.network);
            if(networkData){
                networkData.data.links.forEach((link) => {
                    const sourceId = getLinkId(link, "source");
                    const targetId = getLinkId(link, "target");
                    const sourceNode = networkData.data.nodes.find((f) => f.id === sourceId);
                    const targetNode = networkData.data.nodes.find((f) => f.id === targetId);
                    if(sourceNode && targetNode && sourceNode.nodeDepth !== targetNode.nodeDepth){
                        const depthSource = `${network.network}-depth-${sourceNode.nodeDepth}`;
                        const depthTarget = `${network.network}-depth-${targetNode.nodeDepth}`;
                        addLinkIfNotThere(depthSource,depthTarget, link.type);
                        addLinkIfNotThere(sourceId,targetId,link.type);
                        addLinkIfNotThere(depthSource,targetId, link.type);
                        addLinkIfNotThere(sourceId,depthTarget,link.type);
                    }
                })
                const byDepthGroup = d3.group(networkData.data.nodes, (g) => g.nodeDepth);
                const depthChildren = Array.from(byDepthGroup).reduce((depthAcc,depth) => {
                    const nodeChildren = depth[1].reduce((nodeAcc, node) => {
                        nodeAcc.push({
                            name: node.id,
                            label: node.id,
                            type: "node",
                            value: 1,
                            data: node
                        })
                        return nodeAcc;
                    }, [] as HierarchyNode[])
                    depthAcc.push({
                        name: `${network.network}-depth-${depth[0]}`,
                        label: `${network.network}-${depth[0]}`,
                        type: "depth",
                        depth: depth[0],
                        value: depth[1].length,
                        children: nodeChildren
                    })
                    return depthAcc;
                }, [] as HierarchyNode[]);
                networkAcc.push({
                    name: network.network,
                    label: `${entry[0]}-${network.network}`,
                    type: "network",
                    value: d3.sum(depthChildren, (s) => s.value),
                    children: depthChildren,
                })
            }
            return networkAcc
        },[] as HierarchyNode[])
        acc.push({
            name: `layer${entry[0]}`,
            type:"layer",
            label: `Layer ${entry[0]}`,
            value: d3.sum(networkChildren, (s) => s.value),
            children: networkChildren
        })

        return acc;
    },[] as HierarchyNode[])

    architecture.routes.forEach((route) => {
        const sourceLayer = architecture.layers.find((f) => f.network === route.source_net);
        const targetLayer = architecture.layers.find((f) => f.network === route.dest_net);
        const sourceNetworkDepth = chartData.networks
            .find((f) => f.id === route.source_net)
            ?.data.nodes.find((f) => f.node === route.source_node)?.nodeDepth;
        const targetNetworkDepth = chartData.networks
            .find((f) => f.id === route.dest_net)
            ?.data.nodes.find((f) => f.node === route.dest_node)?.nodeDepth;
        if(sourceLayer && targetLayer && sourceNetworkDepth && targetNetworkDepth){
            const sourceLayerId = `layer${sourceLayer.layer}`;
            const sourceNetworkDepthId = `${route.source_net}-depth-${sourceNetworkDepth}`;
            const sourceNodeId = `${route.source_node}-${route.source_net}`;
            const targetLayerId = `layer${targetLayer.layer}`;
            const targetNetworkDepthId = `${route.dest_net}-depth-${targetNetworkDepth}`;
            const targetNodeId = `${route.dest_node}-${route.dest_net}`
            // could be rationalised!!!
            if(sourceLayerId !== targetLayerId){
                addLinkIfNotThere(sourceLayerId,targetLayerId,"architecture");
            }
            // source layer -> target network
            addLinkIfNotThere(sourceLayerId,route.dest_net,"architecture");
            // source layer -> target network+depth
            addLinkIfNotThere(sourceLayerId,targetNetworkDepthId,"architecture")
            // source layer -> target node
            addLinkIfNotThere(sourceLayerId,targetNodeId,"architecture")
            // source network -> target layer
            addLinkIfNotThere(route.source_net,targetLayerId,"architecture");
            // source network -> target network
            addLinkIfNotThere(route.source_net,route.dest_net,"architecture");
            // source network -> target network+ depth
            addLinkIfNotThere(route.source_net,targetNetworkDepthId,"architecture")
            // source network -> target node
            addLinkIfNotThere(route.source_net,targetNodeId,"architecture");
            // source network + depth -> target layer
            addLinkIfNotThere(sourceNetworkDepthId,targetLayerId,"architecture");
            // source network + depth -> target network
            addLinkIfNotThere(sourceNetworkDepthId,route.dest_net,"architecture");
            // source network + depth -> target network + depth
            addLinkIfNotThere(sourceNetworkDepthId,targetNetworkDepthId,"architecture");
            // source network + depth -> target node
            addLinkIfNotThere(sourceNetworkDepthId,targetNodeId,"architecture");
            // source node => targetLayer
            addLinkIfNotThere(sourceNodeId,targetLayerId,"architecture");
            // source node => targetNetwork
            addLinkIfNotThere(sourceNodeId,route.dest_net,"architecture");
            // source node => target network + depth
            addLinkIfNotThere(sourceNodeId,targetNetworkDepthId,"architecture");
            // source node -> target node
            addLinkIfNotThere(sourceNodeId,targetNodeId,"architecture");
        }
    })

    const hierarchy = d3.hierarchy<HierarchyNode>({
        name: "root",
        type: "root",
        label: "root",
        children: hierarchyChildren,
        value: d3.sum(hierarchyChildren, (s) => s.value)});

    const radiusMax = d3.max(hierarchy.descendants(), (d) => d.data.value) || 0;
    return {nodes: hierarchy.children || [], allLinks, radiusMax};
}
export const drawNonLinear = (
    svg: d3.Selection<d3.BaseType, unknown, HTMLElement, unknown>,
    architecture: Architecture,
    chartData: ChartData,
    svgWidth: number,
    svgHeight: number
) => {

    // add encoding to depth 4 nodes
    // how are we showing depth 4 labels?
    // how are we highlighting - same as other??

    const {nodes, allLinks, radiusMax} = getLinearHierarchy(architecture,chartData);
    const allChildNodes = nodes[0]?.parent?.descendants()
        .filter((f) => f.data.data)
        .reduce((acc, entry) => {
            const nodeCopy = entry.copy();
            acc.push(entry);
            return acc;
        },[] as d3.HierarchyNode<HierarchyNode>[])

    let nodePositions: {[key: string]: {x: number, y: number} } = {};

    const hierarchyTree = d3.treemap<HierarchyNode>()
        .size([svgWidth , svgHeight ]);
    if(nodes[0] && nodes[0].parent){
        const parentCopy = nodes[0].parent.copy();
        parentCopy.count();
        const nodeTree = hierarchyTree(parentCopy);
        if(nodeTree.children){
            nodePositions = nodeTree.children.reduce((acc, entry) => {
                acc[entry.data.name] = {
                    x: entry.x0 + (entry.x1 - entry.x0)/2,
                    y: entry.y0 + (entry.y1 - entry.y0)/2
                }
                return acc;
            }, {} as {[key: string]: {x: number, y: number} })
        }
    }

    let selectedNode = "";

    const radiusRange = [7,80];
    const radiusScale =   d3
        .scaleSqrt()
        .domain([1, radiusMax])
        .range(radiusRange);

    const drillDownSimulation = d3
        .forceSimulation()
        .force("x", d3.forceX((d) => d.x ? d.x : svgWidth/2 ).strength(0.2))
        .force("y", d3.forceY((d) => d.y ? d.y : svgHeight/2).strength(0.3))
        .force("link", d3.forceLink<d3.HierarchyNode<HierarchyNode>,HierarchyLink>().id((d) => d.data.name).strength(0))
        .force("collide",d3.forceCollide<d3.HierarchyNode<HierarchyNode>>((d) => d.data.pathOnly === true ? 0 : radiusScale(d.data.value) * (d.children ? 2.5 : 1.4)))
        .force("repel", d3.forceManyBody<d3.HierarchyNode<HierarchyNode>>().strength((d) => d.children ? -50 : -10));

    const getHierarchyLinks = (visibleNodes: d3.HierarchyNode<HierarchyNode>[]) => allLinks.reduce((acc, link) => {
        const matching = visibleNodes.some((s) => s.data.name === link.source) &&
            visibleNodes.some((s) => s.data.name === link.target);
        if(matching){
            acc.push({
                source: getLinkId(link, "source"),
                target: getLinkId(link, "target"),
                type: link.type
            })
        }
        return acc;

    },[] as HierarchyLink[])
    const drawHierarchyForce = (currentNodes: d3.HierarchyNode<HierarchyNode>[]) => {


        const hierarchyLinks = getHierarchyLinks(currentNodes.filter((f) => f.data.pathOnly !== true));

        const linksGroup = svg
            .select(".linkGroup")
            .selectAll(".linksGroup")
            .data(hierarchyLinks)
            .join((group) => {
                const enter = group.append("g").attr("class", "linksGroup");
                enter.append("path").attr("class", "linkLine");
                return enter;
            });

        linksGroup
            .select(".linkLine")
            .attr("pointer-events","none")
            .attr("stroke-width", 1)
            .attr("stroke",  "#D0D0D0")

        // layer -> network -> depth -> node
        const nodesGroup = svg
            .select(".nodeGroup")
            .selectAll<SVGGElement,ChartNode[]>(".nodesGroup")
            .data(currentNodes)
            .join((group) => {
                const enter = group.append("g").attr("class", "nodesGroup");
                enter.append("path").attr("class","surroundingPath");
                enter.append("circle").attr("class", "nodeBackgroundCircle");
                enter.append("circle").attr("class", "nodeCircle");
                enter.append("text").attr("class", "fa fa-strong nodeCircleIcon");
                enter.append("rect").attr("class", "nodeLabelItem nodeLabelRect");
                enter.append("text").attr("class", "nodeLabelItem nodeLabel");
                return enter;
            });

        const maxDepth = 3;



        nodesGroup.select(".nodeCircle")
            .attr("display", (d) => d.data.pathOnly ? "none" : "block")
            .attr("fill","white")
            .attr("fill",(d) => d.data.data ? getNodeCircleFill(d.data.data, hierarchyLinks) : "white")
            .attr("stroke-width",(d) => d.data.data ? 0 : 1.5)
            .attr("stroke","#484848")
            .attr("stroke-opacity", (d) => (4 - d.depth)/10)
            .attr("r",(d) => radiusScale(d.data.value))
            .on("click", (event, d) => {
                if(d.depth === maxDepth){
                    console.log('highlight')
                    //  if(selectedNode === d.data.name){
                    //      selectedNode = "";
                    //      svg.selectAll(".nodesGroup").attr("opacity",1);
                    //  } else {
                    //      selectedNode = d.data.name;
                    //     if(allChildNodes){
                    //         const allLinks = getHierarchyLinks(allChildNodes);
                    //         const chain = getHierarchyNodeChain(d.data.name,allChildNodes,allLinks);

                    //     }
                    // }
                } else {
                    const childNodes = d.children;
                    if(childNodes){
                        let depthExtent = [];
                        const depthScale = d3.scaleLinear().range([0,70]).domain([1,2])
                        if(d.data.type === "network"){
                            depthExtent = d3.extent(childNodes, (d) => d.data.depth);
                            if(depthExtent[0] !== undefined && depthExtent[1] !== undefined){
                                depthScale.domain(depthExtent);
                            }
                        }
                        childNodes.forEach((c) => {
                            c.data.pathOnly = false;
                            c.x = (d.x || 0) + (c.data.type === "depth" && c.data.depth ? depthScale(c.data.depth) : 0);
                            c.y = d.y;
                            currentNodes.push(c);
                        })
                        if(d.depth < maxDepth){
                            d.data.pathOnly = true;
                            d.x = 0;
                            d.y = 0;
                            if(d.parent){
                                currentNodes = currentNodes.filter((f) => f.data.name !== d.parent?.data.name);
                            }
                        } else {
                            currentNodes = currentNodes.filter((f) => f.data.name !== d.data.name);
                        }

                        drawHierarchyForce(currentNodes);
                    }
                }

            });

        nodesGroup
            .select(".nodeCircleIcon")
            .attr("display", (d) => d.data.pathOnly ? "none" : "block")
            .attr("font-size", (d) =>  d.data.data ? radiusScale(d.data.value) * 1.6 :  radiusScale(d.data.value) * 0.6)
            .attr("fill", (d) => d.data.data ? "white" : "#D0D0D0")
            .attr("text-anchor","middle")
            .style("dominant-baseline","middle")
            .text((d) =>
                d.data.data ? NODETYPE_ICONS[d.data.data.type as keyof typeof NODETYPE_ICONS] :
                NODETYPE_ICONS[d.data.type as keyof typeof NODETYPE_ICONS]);

        nodesGroup
            .select(".nodeLabel")
            .attr("display", (d) => d.data.pathOnly ? "none" : "block")
            .attr("visibility",(d) => d.children ? "visible" : "hidden")
            .attr("pointer-events","none")
            .attr("text-anchor","middle")
            .attr("font-size",14)
            .attr("dy", (d) => radiusScale(d.data.value) + 16)
            .text((d) => d.data.label);

        nodesGroup.select(".surroundingPath")
            .attr("stroke", "white")
            .attr("fill","white")
            .style("stroke-linejoin","round")
            .attr("stroke-width",(d) => radiusScale(d.data.value) * 1.5)
            .attr("id", (d) => `sPath${d.data.name}`)
            .on("click", (event, d) => {
                const parentNode = d.parent;
                if(parentNode){
                    d.data.pathOnly = false;

                }
            });
        const dragstarted = () => {
            currentNodes.forEach((d) => {
                // @ts-expect-error need to align types for simulation
                d.fx = d.x;
                // @ts-expect-error need to align types for simulation
                d.fy = d.y;
            })
            drillDownSimulation.stop();
            drillDownSimulation.alphaTarget(0.1).restart();
        };

        const dragged = (
            event: d3.D3DragEvent<SVGGElement, ChartNode, ChartNode> | d3.SubjectPosition,
            d: d3.HierarchyNode<HierarchyNode>,
        ) => {
            // @ts-expect-error need to align types for simulation
            d.fx = event.x;
            // @ts-expect-error need to align types for simulation
            d.fy = event.y;
        };

        nodesGroup.call(
            d3
                .drag<SVGGElement, d3.HierarchyNode<HierarchyNode>>()
                .on('start', dragstarted)
                .on('drag', dragged),
        );

        drillDownSimulation.on("tick", () => {
            svg
                .selectAll<SVGLineElement,HierarchyLink>(".linkLine")
                .attr("d", (d) => {
                    const source = (d.source as d3.HierarchyNode<HierarchyNode>);
                    const {x: sourceX, y: sourceY} = source;
                    const target =  (d.target as d3.HierarchyNode<HierarchyNode>);
                    const {x: targetX, y: targetY} = target;
                    if(!sourceX || !sourceY || !targetX || !targetY) return ""
                    return `M${sourceX },${sourceY } L${targetX },${targetY}`;
                })

            svg.selectAll<SVGGElement,d3.HierarchyNode<HierarchyNode>>(".nodesGroup")
                .attr("transform", (d) => `translate(${(d.x || 0)},${(d.y || 0) })`);
        });

        // reset the simulation
        drillDownSimulation.nodes([]);
        drillDownSimulation.nodes(currentNodes.filter((f) => f.data.pathOnly !== true));



        const linkForce = drillDownSimulation.force("link");
        if(linkForce){
            (linkForce as d3.ForceLink<d3.HierarchyNode<HierarchyNode>,HierarchyLink>).links([]);
            (linkForce as d3.ForceLink<d3.HierarchyNode<HierarchyNode>,HierarchyLink>).links(hierarchyLinks);
        }
        ;
        drillDownSimulation.stop();
        drillDownSimulation.alpha(1).restart();
        drillDownSimulation.tick(500);


        const normalizeArray = (arr: [number, number][]) => {
            return arr.length < 3
                ? [...arr, ...Array(3 - arr.length).fill(arr[0])]
                : arr;
        }
        currentNodes.filter((f) => f.data.pathOnly === true)
            .forEach((d) => {
                if(d.children){
                    let points  = d.children.reduce((acc,entry) => {
                        acc.push([entry.x || 0, entry.y || 0])
                        return acc;
                    },[] as [number,number][]);
                    if(points.length < 3){
                        points = normalizeArray(points);
                    }
                    const shapePath = d3.polygonHull(points);
                    if(shapePath){
                        d3.select(`#sPath${d.data.name}`)
                            .attr("d", `M${shapePath.join("L")}Z`)
                    }
                }

            })

    }


    const getBaseCopy = () => {
        return nodes.reduce((acc,entry) => {
            const nodeCopy = entry.copy();
            nodeCopy.x = nodePositions[nodeCopy.data.name] ? nodePositions[nodeCopy.data.name].x : svgWidth/2;
            nodeCopy.y = nodePositions[nodeCopy.data.name] ? nodePositions[nodeCopy.data.name].y : svgHeight/2;
            acc.push(nodeCopy);
            return acc;
        },[] as d3.HierarchyNode<HierarchyNode>[]);

    }


    if(nodes){

        drawHierarchyForce(getBaseCopy());

        const svgNode = svg.node() as SVGSVGElement | undefined;
        const baseSvgNode = svgNode?.parentElement;
        if(baseSvgNode){
            const baseSvg = d3.select(baseSvgNode);
            baseSvg.on("click",(event) => {
                if(event.target.tagName === "svg"){
                    drawHierarchyForce(getBaseCopy());
                }
            })
        }
    }

}
