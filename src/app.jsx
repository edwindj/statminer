import React from 'react';
import ReactDOM from 'react-dom';
import Graph from './Components/Graph.jsx';
import Mapping from './Components/Mapping.jsx';
import GraphType from './Components/GraphType.jsx';
import graph_descriptions from './graph_descriptions.js';
import dataservice from './Services/dataservice.js';

class App extends React.Component {

  constructor(props) {
    super(props);
    
    // set initial state
    this.state = {
      mapping: {},
      table_schema: undefined,
      data: undefined,
      schema: undefined,
      graph_type: 1
    };
    
    // bind methods to this
    this.handleMappingChange = this.handleMappingChange.bind(this);
    this.handleGraphTypeChange = this.handleGraphTypeChange.bind(this);
  }

  componentDidMount() {
    var self = this;
    // get the meta from the server; not sure if this is the right method to 
    // put this into
    dataservice.get_schema(function(e, d) {
      if (e) {
        console.log("Failed to load meta:", e);
        return;
      }
      self.setState({table_schema: d});
    });
  }

  handleMappingChange(mapping) {
    this.setState({'mapping': mapping});
    var self = this;
    
    dataservice.get_data(mapping, function(e, d) {
      if (e) {
        console.log("Failed to load data:", e);
        return;
      }
      self.setState({data: d.data, schema: d.meta});
    });
  }

  handleGraphTypeChange(type) {
    console.log("handleGraphTypeChange", type);
    this.setState({graph_type: type.index});
  }

  render() {
    
    const {mapping, table_schema, schema, data, graph_type} = this.state;
    const {graph_descriptions} = this.props;
    const graph_desc = graph_descriptions[graph_type];
    
    console.log("objects", mapping, table_schema, schema, data);
    console.log("state:", this.state);
    
    return (
      <div>
        <Graph width="900" height="400" 
          graph={graph_desc}
          schema={schema} data={data} 
          mapping={mapping}/>
          
        <GraphType graphtypes={graph_descriptions}
          initialSelection={graph_desc.name}
          onTypeChange={this.handleGraphTypeChange}/>
          
        <Mapping description={graph_desc}
          variables={table_schema} 
          initialSelection={mapping} 
          onChange={this.handleMappingChange}/>
      </div>
    );
  }
}


ReactDOM.render(
  <App graph_descriptions={graph_descriptions}/>, 
  document.getElementById('app')
);

/*

*/
