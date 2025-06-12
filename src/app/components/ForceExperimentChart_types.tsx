export interface DataNode {
    node:string;
    type: string;
    class: string;
    desc: string;
    nodeDepth?: number;
}
export interface ChartNode extends d3.SimulationNodeDatum {
    node:string;
    type: string;
    class: string;
    desc: string;
    nodeDepth: number;
}

export interface ChartLink extends d3.SimulationLinkDatum<ChartNode>{
    source: string | ChartNode;
    target: string | ChartNode;
    type: string;
}

type ArcRoute = {
    source_net: string;
    source_node: string;
    dest_net: string;
    dest_node: string;
}

export type Network = {
    network: string;
    network_desc: string;
    nodes: ChartNode[];
    links: ChartLink[];
}


type Layer = {
    layer: number;
    network: string;
}
export type Architecture = {
    arch_id: number;
    arch_name: string;
    arch_num_layers: number;
    layers:Layer[];
    routes: ArcRoute[];
}

export type ArchFile = {
    num_arch: number;
    architectures: Architecture[];
}

export type ChartData = {
    architecture: Architecture[],
    networks: { id: string, data: Network}[];
}
export interface ForceExperimentChartProps {
    chartData: ChartData;
    containerClass: string;
    direction: string;
}
