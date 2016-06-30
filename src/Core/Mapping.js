
// Class that keeps track of the mapping of variables on the axes of a graph
//
// Constructor:
// Expects a description of the graph and the schema of the table.
//
// Computed properties:
// - mapping (get): returns the mapping object
//
// Methods:
// - add_variabe_to_axis(axis_name, variable_name): returns true when the
//   variable was successfully added to the axis; false otherwise
//
// - remove_variable_from_axis(axis_name, variable_name): returns true when
//   the variable was successfully removes; false otherwise
//
// - add_filter(variable_name, filter): filter should be an array of category
//   names. A filter can only be applied to a categorical variable. When the
//   variable is not assigned to one of the axes filter should contain only
//   one category. Returns false when the filter could not be applied; true
//   otherwise. A filter of false/[]/undefined removes any filters from
//   variable.
//
class Mapping {
  constructor(graph, schema) {
    this.schema = schema;
    this.graph = graph;
    // initialise mapping object
    this.map = {};
    for (let i = 0; i != graph.axes.length; ++i) {
      var axis = graph.axes[i];
      this.map[axis.name] = [];
    }
    // initialise filter object
    this.filter = {};
  }

  get mapping() {
    let mapping = {};
    const filter = this.filter;
    // create mapping
    for (let axis_name in this.map) {
      if (this.map.hasOwnProperty(axis_name)) {
        mapping[axis_name] = this.map[axis_name].map(function(x) {
          if (filter[x]) {
            return {variable: x, filter: filter[x]};
          } else {
            return {variable: x};
          }
        });
      }
    }
    // add filter to mapping
    mapping.filter = [];
    const self = this;
    mapping.filter = this.schema.fields
      .filter((x) => !self.variable_on_axis(x.name))
      .filter((x) => (x.categories))
      .map((x) => ({variable: x.name, filter: filter[x.name]}));
    return mapping;
  }

  variable_on_axis(variable_name) {
    for (var axis_name in this.map) {
      if (this.map.hasOwnProperty(axis_name)) {
        if (this.map[axis_name].indexOf(variable_name) !== -1) return true;
      }
    }
    return false;
  }

  add_variable_to_axis(axis_name, variable_name) {
    // lookup variable description in meta
    const variable = this.schema.fields.find((x) => x.name === variable_name);
    if (!variable) return false;
    // lookup axis description
    const axis = this.graph.axes.find((x) => x.name === axis_name);
    if (!axis) return false;
    // check if variable if of correct type
    if (axis.accepts.indexOf(variable.type) === -1) return false;
    // if the variable is not yet on an axis; check if filter needs to be
    // modified; for now: delete filter
    if (!this.variable_on_axis(variable.name))
      delete this.filter[variable.name];
    // add variable to axis
    this.map[axis.name] = [variable_name];
    return true;
  }

  remove_variable_from_axis(axis_name, variable_name) {
    if (!this.map[axis_name]) return false;
    const i = this.map[axis_name].indexOf(variable_name);
    if (i === -1) return false;
    this.map[axis_name] = [];
    // If variable is no longer on any axis; check if filter needs to be
    // modified; for now: delete filter
    if (!this.variable_on_axis(variable_name))
      delete this.filter[variable_name];
    return true;
  }

  add_filter(variable_name, filter) {
    // lookup variable description in meta
    const variable = this.schema.fields.find((x) => x.name === variable_name);
    if (!variable) return false;
    // if filter is empty/falsey remove any existing filter; and done
    if (!filter) {
      delete this.filter[variable_name]
      return true;
    }
    // for now only categorical variables are supported
    if (!variable.categories) return false;
    // check validity of filter; check if all elements of filter in categories
    var valid = filter.reduce((x,y) =>
      (x && variable.categories.findIndex((x) => x.name == y) !== -1), true);
    if (!valid) return false;
    // if variable not on axis only one category can be selected
    if (!this.variable_on_axis(variable_name) && filter.length > 1)
      return false;
    // create filter
    this.filter[variable_name] = filter;
    return true;
  }

}

export default Mapping;
