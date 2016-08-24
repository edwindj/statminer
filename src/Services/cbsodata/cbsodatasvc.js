// Generated by CoffeeScript 1.10.0
(function() {
  var DIMENSION, GEO, NUMERIC, TIME, TOPIC, api, cached_meta, catalog, datefield_decoder, datefield_encoder, get_data, get_data_fields, get_datapackage, get_fieldhash, get_tables, odata_to_datapackage, postfilter, prefilter, record_encoder, search, shallow_clone, to_label, to_tablelistitem,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  api = require("cbsodata").api;

  catalog = require("cbsodata").catalog;

  TIME = "Cbs.OData.TimeDimension";

  GEO = "Cbs.OData.GeoDimension";

  TOPIC = "Cbs.OData.Topic";

  DIMENSION = ["Cbs.OData.Dimension", TIME, GEO];

  NUMERIC = ["Double", "Float", "Integer", "Long"];

  cached_meta = {
    name: null
  };

  to_label = function(label) {
    label = label.replace(/_/g, "");
    return label;
  };

  to_tablelistitem = function(odata_table) {
    var item;
    item = {
      id: odata_table.Identifier,
      name: odata_table.ShortTitle,
      summary: odata_table.Summary
    };
    return item;
  };

  odata_to_datapackage = function(metadata) {
    var cat, categories, col, data_properties, datapkg, field, fields, i, j, len, len1, ocat, ref, ref1, schema, ti;
    data_properties = metadata.DataProperties;
    ti = metadata.TableInfos[0];
    datapkg = {
      name: ti.Identifier,
      title: ti.Title,
      summary: ti.Summary,
      description: ti.Description,
      resources: []
    };
    fields = [];
    schema = {
      name: datapkg.name,
      path: "?",
      schema: {
        fields: fields
      }
    };
    for (i = 0, len = data_properties.length; i < len; i++) {
      col = data_properties[i];
      if (!(col.Position != null)) {
        continue;
      }
      field = {
        name: col.Key,
        title: col.Title,
        description: col.Description
      };
      field.type = col.Type === "Topic" ? "number" : col.Type === "Dimension" ? "categorical" : col.Type === "GeoDimension" ? "categorical" : col.Type === "TimeDimension" ? "date" : "string";
      if (col.Unit != null) {
        field.unit = col.Unit;
      }
      field.encode = field.decode = function(value) {
        return value;
      };
      if (field.type === "date") {
        field.encode = datefield_encoder;
        field.decode = datefield_decoder;
      }
      if ((ref = field.type) === "categorical" || ref === "date") {
        categories = field.categories = [];
        ref1 = metadata[field.name];
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          ocat = ref1[j];
          cat = {
            name: field.encode(ocat.Key),
            title: to_label(ocat.Title),
            description: ocat.Description
          };
          categories.push(cat);
        }
        if (field.type !== "date") {
          field.aggregate = categories[0].name;
        }
        field["default"] = field.aggregate || categories[categories.length - 1].name;
      }
      fields.push(field);
    }
    datapkg.resources.push(schema);
    return datapkg;
  };

  datefield_encoder = function(value) {
    var a, sl_date, type;
    sl_date = /^(\d{4})(JJ|MM|KW)(\d{2})$/;
    if (!sl_date.test(value)) {
      return value;
    }
    a = sl_date.exec(value);
    type = a[2];
    if (type === "JJ") {
      return a[1];
    }
    if (type === "KW") {
      return a[1] + "Q" + a[3];
    }
    if (type === "MM") {
      return a[1] + "M" + a[3];
    }
    return value;
  };

  datefield_decoder = function(value) {
    var is_month, is_quarter, is_year, m, y;
    is_year = /^(\d{4})$/;
    is_month = /^(\d{4})M(\d{2})$/;
    is_quarter = /^(\d{4})Q(\d{2})$/;
    if (is_year.test(value)) {
      y = is_year.exec(value);
      return y[1] + 'JJ00';
    } else if (is_month.test(value)) {
      m = is_month.exec(value);
      return m[1] + "MM" + m[2];
    } else if (is_quarter.test(value)) {
      m = is_quarter.exec(value);
      return m[1] + "KW" + m[2];
    } else {
      return value;
    }
  };

  get_datapackage = function(table) {
    return api.get_meta(table).then(odata_to_datapackage).then(function(dpkg) {
      cached_meta = dpkg;
      return dpkg;
    });
  };

  prefilter = function(filter) {
    var fh, field, odata_filter, post_filter, res, v, varfilter;
    fh = get_fieldhash();
    odata_filter = {};
    post_filter = {};
    for (v in filter) {
      varfilter = filter[v];
      res = odata_filter;
      if (varfilter.length > 10) {
        res = post_filter;
      }
      field = fh[v] || {
        decode: function(x) {
          return x;
        }
      };
      res[v] = varfilter.map(field.decode);
    }
    return {
      filter: filter,
      post_filter: post_filter,
      odata_filter: odata_filter
    };
  };

  postfilter = function(filter) {
    var pf;
    pf = function(record) {
      var codes, v;
      for (v in filter) {
        codes = filter[v];
        if (codes.indexOf(record[v]) < 0) {
          return false;
        }
      }
      return true;
    };
    return pf;
  };

  record_encoder = function(schema) {
    var dr;
    dr = function(record) {
      var changed, field, i, len, ref;
      changed = {};
      ref = schema.fields;
      for (i = 0, len = ref.length; i < len; i++) {
        field = ref[i];
        changed[field.name] = field.encode(record[field.name]);
      }
      return changed;
    };
    return dr;
  };

  get_fieldhash = function() {
    var fh, field, i, len, ref, schema;
    fh = {};
    if (cached_meta) {
      schema = cached_meta.resources[0].schema;
      ref = schema.fields;
      for (i = 0, len = ref.length; i < len; i++) {
        field = ref[i];
        fh[field.name] = field;
      }
    }
    return fh;
  };

  get_data = function(table, filter, select) {
    var add_fields, pf;
    pf = prefilter(filter);
    add_fields = function(data) {
      var schema;
      if (cached_meta.name === table) {
        schema = get_data_fields(cached_meta, filter, select);
        data = data.map(record_encoder(schema));
        console.log(data);
        return {
          schema: schema,
          data: data
        };
      } else {
        return get_datapackage(table).then(function() {
          return add_fields(data);
        });
      }
    };
    return api.get_data(table, pf.odata_filter, select).then(function(data) {
      return data.filter(postfilter(pf.post_filter));
    }).then(function(data) {
      return add_fields(data);
    });
  };

  shallow_clone = function(obj, res) {
    var k, v;
    if (res == null) {
      res = {};
    }
    for (k in obj) {
      v = obj[k];
      res[k] = v;
    }
    return res;
  };

  get_data_fields = function(schema, filter, select) {
    var cats, df, fields, i, len, v;
    df = {
      name: schema.name,
      title: schema.title
    };
    fields = schema.resources[0].schema.fields.map(function(v) {
      return shallow_clone(v);
    }).filter(function(v) {
      var ref;
      return ref = v.name, indexOf.call(select, ref) >= 0;
    });
    for (i = 0, len = fields.length; i < len; i++) {
      v = fields[i];
      cats = filter[v.name];
      if (cats && v.categories) {
        v.categories = v.categories.filter(function(cat) {
          var ref;
          return ref = cat.name, indexOf.call(cats, ref) >= 0;
        });
      }
    }
    df.fields = fields;
    return df;
  };

  search = function(query) {
    return catalog.get_tables(query);
  };

  get_tables = function(filter, select, cb) {
    return catalog.get_tables(filter, select, cb);
  };

  module.exports = {
    get_data: get_data,
    get_data_fields: get_data_fields,
    get_tables: get_tables,
    get_datapackage: get_datapackage,
    get_schema: get_datapackage
  };

}).call(this);
