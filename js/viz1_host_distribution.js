d3.json("data/hosts_with_coordinates.json").then(function (data) {
    const svg = d3.select("#viz1 svg");
    const width = +svg.attr("width");
    const height = +svg.attr("height");

    const projection = d3.geoNaturalEarth1().scale(150).translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);

    const g = svg.append("g"); // Create a group for all map elements

    // Variables for zoom and pan
    const panStep = 50; // Number of pixels to pan
    let currentTransform = d3.zoomIdentity; // Track current zoom/pan state

    // Add zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([1, 8]) // Zoom scale range: 1x to 8x
        .on("zoom", (event) => {
            currentTransform = event.transform; // Update current transform
            g.attr("transform", currentTransform); // Apply zoom/pan to the group
        });

    svg.call(zoom); // Enable zoom and pan on the SVG

    // Add zoom in/out buttons
    d3.select("#zoom-in").on("click", () => {
        svg.transition().call(zoom.scaleBy, 1.2); // Zoom in by 20%
    });

    d3.select("#zoom-out").on("click", () => {
        svg.transition().call(zoom.scaleBy, 0.8); // Zoom out by 20%
    });

    // Add directional pan buttons
    function pan(x, y) {
        currentTransform = currentTransform.translate(x, y); // Update pan
        g.attr("transform", currentTransform); // Apply new pan state
    }

    d3.select("#pan-up").on("click", () => pan(0, -panStep)); // Pan up
    d3.select("#pan-down").on("click", () => pan(0, panStep)); // Pan down
    d3.select("#pan-left").on("click", () => pan(-panStep, 0)); // Pan left
    d3.select("#pan-right").on("click", () => pan(panStep, 0)); // Pan right

    // Calculate hosting frequency and years by country
    const hostingDetails = {};
    data.forEach(d => {
        if (!hostingDetails[d.game_location]) {
            hostingDetails[d.game_location] = { count: 0, years: [] };
        }
        hostingDetails[d.game_location].count += 1;
        hostingDetails[d.game_location].years.push(d.game_year);
    });

    // Normalize hosting frequency for color intensity
    const maxHosting = Math.max(...Object.values(hostingDetails).map(d => d.count));
    const colorScale = d3.scaleLinear()
        .domain([1, maxHosting])
        .range(["#ADD8E6", "#00008B"]); // Light blue to dark blue

    // Add a tooltip div
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("font-family", "Arial, sans-serif")
        .style("font-size", "12px")
        .style("box-shadow", "0px 2px 6px rgba(0, 0, 0, 0.2)");

    // Load GeoJSON for the world map
    d3.json("data/world.geojson").then(function (world) {
        // Append countries to the map
        g.append("g")
            .selectAll("path")
            .data(world.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", d => {
                const countryName = d.properties.name;
                return hostingDetails[countryName] ? colorScale(hostingDetails[countryName].count) : "#d3d3d3";
            })
            .attr("stroke", "#ffffff")
            .on("mouseover", (event, d) => {
                const countryName = d.properties.name;
                const details = hostingDetails[countryName];
                if (details) {
                    tooltip.transition().duration(200).style("opacity", 1);
                    tooltip.html(`<strong>Country:</strong> ${countryName}<br>
                                  <strong>Times Hosted:</strong> ${details.count}<br>
                                  <strong>Years:</strong> ${details.years.join(", ")}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                }
            })
            .on("mousemove", (event) => {
                tooltip.style("left", (event.pageX + 10) + "px")
                       .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
                tooltip.transition().duration(500).style("opacity", 0);
            });

        // Add circles for individual host cities
        g.selectAll(".host")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "host")
            .attr("cx", d => projection([d.longitude, d.latitude])[0])
            .attr("cy", d => projection([d.longitude, d.latitude])[1])
            .attr("r", 2)
            .attr("fill", "red")
            .attr("opacity", 0.7)
            .on("mouseover", (event, d) => {
                const details = hostingDetails[d.game_location];
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`<strong>Country:</strong> ${d.game_location}<br>
                              `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mousemove", (event) => {
                tooltip.style("left", (event.pageX + 10) + "px")
                       .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
                tooltip.transition().duration(500).style("opacity", 0);
            });
    });
});
