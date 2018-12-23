import * as React from 'react';
import * as d3 from 'd3';
import { observer, inject } from 'mobx-react'
import { StoreType } from '../store'
import { ipcRenderer } from 'electron';
import AwesomeComponent from './AwesomeComponent';

type Props = {
  store?: StoreType
}



// declare var d3: any;
const initialState = {
  width: 500,
  height: 500,
  data: {
    "name": "A1",
    "children": [
      {
        "name": "B1",
        "children": [
          {
            "name": "C1",
            "value": 100
          },
          {
            "name": "C2",
            "value": 300
          },
          {
            "name": "C3",
            "value": 200
          }
        ]
      },
      {
        "name": "B2",
        "value": 200
      }
    ]
  }
}

type StateType = Readonly<typeof initialState>
@inject('store')
@observer
export default class Home extends React.Component<Props, StateType> {
  // may need "readonly"
  state: StateType = initialState

  componentDidMount() {
    this.drawChart();
    this.drawTreemap();
  }

  private drawChart() {
    // const svg = d3.select("svg")
    //   .append("circle")
    //   .attr("r", 250)
    //   .attr("cx", this.state.width / 2)
    //   .attr("cy", this.state.height / 2)
    //   .attr("fill", "aquamarine")
    //   .attr("transform", "translate(" + this.state.width / 10 + "," + this.state.height / 10 + ")");

    const radius = (Math.min(this.state.width, this.state.height) / 2) - 10;

    const root = d3.hierarchy(this.state.data);
    var handleEvents = function (selection: any) {
      selection.on('mouseover', function () {
        let g = d3.select(this);
        let n = g.select('.the-node');

        if (n.classed('solid')) {
          n.transition().duration(400)
            .style('fill', "rgba(25,100,255,0.3)")
            .attr('r', 18);
        } else {
          n.transition().duration(400)
            .style('fill', "rgba(25,100,255,0.3)");
        }

        g.select('.label')
          .transition().duration(700)
          .style('fill', 'grey')

      })
        .on('mouseout', function () {
          let g = d3.select(this);
          let n = g.select('.the-node');

          if (n.classed('solid')) {
            n.transition().duration(400)
              .style('fill', "#696969")
              .attr('r', 14);
          } else {
            n.transition().duration(400)
              .style('fill', "rgba(25,100,255,0.5)")
          }
          g.select('.label')
            .transition().duration(700)
            .style('fill', "black")
        });
    }
    const sunburstLayout = d3.partition();

    sunburstLayout.size([2 * Math.PI, radius]);
    const arc = d3.arc()
      .startAngle(function (d) { return d.x0 })
      .endAngle(function (d) { return d.x1 })
      .innerRadius(function (d) { return d.y0 })
      .outerRadius(function (d) { return d.y1 })

    root.sum(d => d.value);

    sunburstLayout(root);
    // console.log('root: ', root);

    const main = d3.select('#sunburst');
    var sunburstNodes = main.selectAll('g')
      .data(root.descendants())
      .enter()
      .append('g').attr("class", "node")
      .attr("transform", "translate(" + this.state.width / 2 + "," + this.state.height / 2 + ")")
      .call(handleEvents)
    var paths = sunburstNodes.append('path')
      .attr('d', arc)
      .classed('the-node', true)
      .style('fill', 'rgba(25,100,255,0.5)')
      .style('stroke', '#FFFFFF')
      .style('stroke-width', 6);

    var labels = sunburstNodes.append("text")
      .attr('class', 'label')
      .attr("transform", function (d) {
        return "translate(" + arc.centroid(d)
          /*+ ") rotate(" + computeTextRotation(d) */ + ")";
      })
      .attr("dx", "-4")
      .attr("dy", '.5em')
      .text(function (d) { return d.parent ? d.data.name : "" });

    // https://bl.ocks.org/denjn5/f059c1f78f9c39d922b1c208815d18af
    // function computeTextRotation(d) {
    //   var angle = (d.x0 + d.x1) / Math.PI * 90;
    //   return (angle < 180) ? angle - 90 : angle + 90;
    // }
  }

  private drawTreemap() {
    const root = d3.hierarchy(this.state.data);
    const treemapLayout = d3.treemap();

    treemapLayout
      .size([600, 300])
      .paddingTop(20)
      .paddingInner(2);

    root.sum(function (d: any) {
      return d.value;
    });

    treemapLayout(root);

    const nodes = d3.select('#treemap')
      .selectAll('g')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('transform', function (d) { return 'translate(' + [d.x0, d.y0] + ')' })
      .attr("fill", 'rgba(25,100,255,0.2)')

    nodes
      .append('rect')
      .attr('width', function (d) { return d.x1 - d.x0; })
      .attr('height', function (d) { return d.y1 - d.y0; })
      .style('stroke', '#FFFFFF')

    nodes
      .append('text')
      .attr('dx', 4)
      .attr('dy', 4)
      .style('fill', "#696969")
      .style('font-size', 10)
      .attr("transform", "translate(" + "10" + "," + "10" + ")")
      .text(function (d) {
        return d.data.name;
      })

    treemapLayout.tile(d3.treemapDice)
  }

  handleDrawChart = (): void => {
    this.drawChart();
  }

  handleDrawTreeMap = (): void => {
    this.drawTreemap();
  }

  doSetIsChartSelectedTrue = (): void => {
    this.props.store.setIsChartSelectedTrue();
  }

  doSetIsChartSelectedFalse = (): void => {
    this.props.store.setIsChartSelectedFalse();
  }

  doSetIsLoadingTrue = (): void => {
    this.props.store.setIsLoadingTrue();
  }

  render() {
    const { store } = this.props
    return (
      <div className="mainContainerHome">
        <div className="smallerMainContainer">
          <div id="graphsContainer">
            {store.isChartSelected && <svg width={this.state.width} height={this.state.height} id="sunburst" />}
            {!store.isChartSelected && <svg width={this.state.width} height={this.state.height} id="treemap" />}
          </div>
          <div id="buttonContainer">
            <button onClick={this.doSetIsChartSelectedTrue}>Draw Chart</button>
            <button onClick={this.doSetIsChartSelectedFalse}>Draw Treemap</button>
          </div>
        </div>
      </div>
    );
  }
}