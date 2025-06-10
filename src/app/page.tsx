'use client';

import ForceExperimentChart from "@/app/components/ForceExperimentChart";
import ARCH from "@/data/ARCH.json";
import CN from "@/data/CN.json";
import MFON from "@/data/MFON.json";
import MIN from "@/data/MIN.json";
import MEN from "@/data/MEN.json";
import MON from "@/data/MON.json";
import OEN from "@/data/OEN.json";
import OFON from "@/data/OFON.json";
import OIN from "@/data/OIN.json";
import PPN from "@/data/PPN.json";
import PPON from "@/data/PPON.json";
import { ChartData} from "@/app/components/ForceExperimentChart_types";
export default  function Home() {

 const chartData: ChartData =  {
     architecture: ARCH.architectures,
     networks: [
         {id: "CN",data: CN},
         {id: "OEN",data: OEN},
         {id: "OFON",data: OFON},
         {id: "OIN",data: OIN},
         {id: "MFON",data: MFON},
         {id: "MEN",data: MEN},
         {id: "MIN",data: MIN},
         {id: "MON",data: MON},
         {id: "PPN",data: PPN},
         {id: "PPON",data: PPON}]
 };

  return (
      <>
          <div>
           <div className="items-start h-[60px] w-full bg-gray-700 flex justify-between  p-5">
               <select id="chooseArchitecture"></select>
               <div  id="networkRadioGroup"></div>
           </div>
           <div className="d3ChartContainer grid items-center justify-items-center h-[calc(100vh-60px)] p-0 font-[family-name:var(--font-figtree)]">
                 <ForceExperimentChart
                  containerClass={"d3Chart"}
                  chartData={chartData}
              />
          </div>
          </div>
      </>

  );
}
