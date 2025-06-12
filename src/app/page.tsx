'use client';

import ForceExperimentChart from "@/app/components/ForceExperimentChart";
import ARCH from "@/app/data/ARCH.json";
import CN from "@/app/data/CN.json";
import MFON from "@/app/data/MFON.json";
import MIN from "@/app/data/MIN.json";
import MEN from "@/app/data/MEN.json";
import MON from "@/app/data/MON.json";
import OEN from "@/app/data/OEN.json";
import OFON from "@/app/data/OFON.json";
import OIN from "@/app/data/OIN.json";
import PPN from "@/app/data/PPN.json";
import PPON from "@/app/data/PPON.json";
import {ChartData, ChartLink, ChartNode, DataNode} from "@/app/components/ForceExperimentChart_types";
import {useState} from "react";
export default  function Home() {
 const addProps = (networkData: {network: string, network_desc: string, nodes: DataNode[], links: ChartLink[] }) => {

     const {nodes,links, network, network_desc} = networkData;
     if(!nodes.some((s) => s.nodeDepth === undefined)) return {network, network_desc, nodes: nodes as ChartNode[], links};;

     let sourceNodes = links
        .filter((f) => !links.some((s) => s.target === f.source));
     const sourceNodeIds = [... new Set(sourceNodes.map((m) => m.source))];
     let targetNodeIds = [... new Set(sourceNodes.map((m) => m.target))];
     let currentDepth = 1;
     nodes.map((m) => {
         if(!links.some((s) => s.source === m.node || s.target === m.node)){
             m.nodeDepth = 0;
         }
        if(sourceNodeIds.includes(m.node)){
            m.nodeDepth = currentDepth;
        }
        if(targetNodeIds.includes(m.node)){
            m.nodeDepth = currentDepth + 1;
        }
     })

     currentDepth += 2

    while(nodes.some((s) => s.nodeDepth === undefined)){
         sourceNodes = links
             .filter((f) => targetNodeIds.includes(f.source));
         targetNodeIds = [... new Set(sourceNodes.map((m) => m.target))];
         nodes.map((m) => {
             if (targetNodeIds.includes(m.node) && !m.nodeDepth) {
                 m.nodeDepth = currentDepth;
             }
         });
         currentDepth += 1
    }


     return {network, network_desc, nodes: nodes as ChartNode[], links};
 }
    const [direction, setDirection] = useState('horizontal');

    const handleDirectionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setDirection(event.target.value);
    };

 const chartData: ChartData =  {
     architecture: ARCH.architectures,
     networks: [
         {id: "CN",data: addProps(CN)},
         {id: "OEN",data: addProps(OEN)},
         {id: "OFON",data: addProps(OFON)},
         {id: "OIN",data: addProps(OIN)},
         {id: "MFON",data: addProps(MFON)},
         {id: "MEN",data: addProps(MEN)},
         {id: "MIN",data: addProps(MIN)},
         {id: "MON",data: addProps(MON)},
         {id: "PPN",data: addProps(PPN)},
         {id: "PPON",data: addProps(PPON)}]
 };

  return (
      <>
          <div>
           <div className="items-start h-[60px] w-full bg-gray-700 flex justify-between  p-5">
               <select id="chooseArchitecture"></select>
               <div className=" w-[200px]">
                   <input
                       className="ml-2 mr-2"
                       type="radio"
                       id="horizontal"
                       name="direction"
                       value="horizontal"
                       checked={direction === 'horizontal'}
                       onChange={handleDirectionChange}
                   />
                   <label htmlFor="horizontal">horizontal</label>
                   <input
                       className="ml-2 mr-2"
                       type="radio"
                       id="vertical"
                       name="direction"
                       value="vertical"
                       checked={direction === 'vertical'}
                       onChange={handleDirectionChange}
                   />
                   <label htmlFor="vertical">vertical</label>
               </div>
                   <div  id="networkRadioGroup"></div>
           </div>
           <div className="d3ChartContainer grid items-center justify-items-center h-[calc(100vh-60px)] p-0 font-[family-name:var(--font-figtree)]">
                 <ForceExperimentChart
                  containerClass={"d3Chart"}
                  chartData={chartData}
                  direction = {direction}
              />
          </div>
          </div>
      </>

  );
}
