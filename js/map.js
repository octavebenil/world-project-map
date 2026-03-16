let selectedCountries = [];

function loadProjects(){

    jQuery.post(WPIM.ajax_url,{
        action:"wpim_filter",
        countries:selectedCountries
    },function(data){

        document.getElementById("wpim-projects").innerHTML=data;

    });

}

loadProjects();


const width = 1000;
const height = 550;

const svg = d3.select("#wpim-map")
    .append("svg")
    .attr("width","100%")
    .attr("height",height);

const projection = d3.geoMercator()
    .scale(150)
    .translate([width/2,height/1.5]);

const path = d3.geoPath().projection(projection);

const g = svg.append("g");

svg.call(
    d3.zoom().scaleExtent([1,8]).on("zoom",(event)=>{
        g.attr("transform",event.transform);
    })
);

fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
    .then(res=>res.json())
    .then(data=>{

        const countries = topojson.feature(data,data.objects.countries);

        g.selectAll("path")
            .data(countries.features)
            .enter()
            .append("path")
            .attr("d",path)
            .attr("fill","#e0e0e0")
            .attr("stroke","#999")

            .each(function(d){

                let match = WPIM.countries.find(c =>
                    d.properties.name &&
                    d.properties.name.toLowerCase().includes(c.name.toLowerCase())
                );

                if(match){

                    d3.select(this)
                        .attr("fill","#2c7be5")
                        .style("cursor","pointer")

                        .on("click",function(){

                            if(selectedCountries.includes(match.slug)){

                                selectedCountries = selectedCountries.filter(c=>c!=match.slug);

                                d3.select(this).attr("fill","#2c7be5");

                            }else{

                                selectedCountries.push(match.slug);

                                d3.select(this).attr("fill","#ff6600");

                            }

                            loadProjects();

                        });

                }

            });

    });