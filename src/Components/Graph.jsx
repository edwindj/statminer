import React from 'react';
import ReactDOM from 'react-dom';


class Graph extends React.Component {

  constructor(props) {
    super(props);
    // bind methods to this
    this.renderGraph = this.renderGraph.bind(this);
  }

  renderGraph() {
    const {graph, schema, data, mapping} = this.props;

    if (graph.can_draw(schema, data, mapping)) {
      var svg = ReactDOM.findDOMNode(this);
      // clear previous graph
      d3.selectAll(svg.childNodes).remove();
      // setup of graph
      graph.graph.width(this.props.width)
        .height(this.props.height)
        .schema(this.props.schema)
        .assign(this.props.mapping)
        .data(this.props.data);
      // render
      graph.graph(d3.select(svg));
    }
  }

  componentDidMount() {
    this.renderGraph();
  }

  componentDidUpdate() {
    this.renderGraph();
  }

  render() {
    const {graph, schema, data, mapping, filter} = this.props;
    
    if (graph.can_draw(schema, data, mapping)) {
      return (<svg width={this.props.width} height={this.props.height}></svg>);
    } else {
      return (<span>Invalid mapping</span>);
    }
  }
}

export default Graph;
