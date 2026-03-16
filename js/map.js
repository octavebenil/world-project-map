let selectedCountry = null;
let selectedElement = null;
let currentPage = 1;


/* ---------------------------
LOAD PROJECTS
--------------------------- */

function loadProjects(page = 1) {

    currentPage = page;

    let countries = [];

    console.log("Selected country");
    console.log(selectedCountry);

    if (selectedCountry) {
        //open new tab
        window.open("https://dropstone.ch/country/" + selectedCountry, "_blank");
        countries.push(selectedCountry);
    }

    jQuery.post(WPIM.ajax_url, {
        action: "wpim_filter",
        countries: countries,
        page: currentPage
    }, function (data) {

        document.getElementById("wpim-projects").innerHTML = data;

    });

}


/* load initial projects */

document.addEventListener("DOMContentLoaded", function () {

    loadProjects();

    initMap();

});



/* ---------------------------
PAGINATION
--------------------------- */

document.addEventListener("click", function (e) {

    if (e.target.classList.contains("wpim-page")) {

        let page = parseInt(e.target.dataset.page);

        loadProjects(page);

    }

});



/* ---------------------------
MAP INITIALIZATION
--------------------------- */

function initMap() {

    const width = 1000;
    const height = 550;

    const svg = d3.select("#wpim-map")
        .append("svg")
        .attr("width", "100%")
        .attr("style", "width: 100%;")
        .attr("height", height);

    const projection = d3.geoMercator()
        .scale(150)
        .translate([width / 2, height / 1.5]);

    const path = d3.geoPath().projection(projection);

    const g = svg.append("g");


    /* zoom */

    svg.call(
        d3.zoom().scaleExtent([1, 8]).on("zoom", (event) => {
            g.attr("transform", event.transform);
        })
    );



    /* load world map */

    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
        .then(res => res.json())
        .then(data => {

            const countries = topojson.feature(data, data.objects.countries);


            g.selectAll("path")
                .data(countries.features)
                .enter()
                .append("path")
                .attr("d", path)
                .attr("stroke", "#999")

                /* color countries */

                .attr("fill", function (d) {

                    let match = WPIM.countries.find(c =>
                        d.properties.name &&
                        d.properties.name.toLowerCase().includes(c.name.toLowerCase())
                    );

                    return match ? "#2c7be5" : "#e0e0e0";

                })


                /* click event */

                .on("click", function (event, d) {

                    let match = WPIM.countries.find(c =>
                        d.properties.name &&
                        d.properties.name.toLowerCase().includes(c.name.toLowerCase())
                    );

                    if (!match) return;


                    /* reset previous selection */

                    if (selectedElement) {
                        selectedElement.attr("fill", "#2c7be5");
                    }


                    /* select new country */

                    selectedCountry = match.slug;

                    selectedElement = d3.select(this);

                    selectedElement.attr("fill", "#ff6600");


                    /* reload projects */

                    loadProjects(1);

                });

        });

}