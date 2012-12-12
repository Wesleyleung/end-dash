var _ = require("underscore")

function CollectionFactory(name, selector) {
  this.name = name
  this.selector = selector
}


CollectionFactory.prototype.setTemplateFactory = function(TemplateFactory) {
  this.TemplateFactory = TemplateFactory
  return TemplateFactory
}

CollectionFactory.prototype.generate = function(parent) {
  var that = this

  function Collection(models) {
    this.length = 0
    this.Template = that.TemplateFactory.generate()
    this.templates = []
    this.container = parent.contents().andSelf().filter(that.selector)
    if(models) {
      this.bind(models)
    }
  }

  Collection.prototype.bind = function(collection) {
    if(_.isArray(collection)) {
      this.push(collection)
    } else {
      this.push(collection.models)
      collection.on("add", function(model, collection, opts) {
        this.add(model, { at: opts.index })
      }, this)

      collection.on("remove", function(model, collection, opts) {
        var index = opts.index
        this.remove(this.at(index))
      }, this)
    }
  }

  Collection.prototype.remove = function(template) {
    if(_.isArray(template)) {
      return _(template).each(this.remove, this)
    }
    var index = _(this.templates).indexOf(template)
    if(index < 0) {
      throw new Error("Cannot remove a template that's not in collection")
    }
    this.templates.splice(index, 1)
    this.container.children().eq(index).remove()

    this.length = this.templates.length
  }

  Collection.prototype.at = function(index) {
    return this.templates[index]
  }

  Collection.prototype.add = function(models, opts) {
    opts = opts || {}
    opts.at = opts.at || this.templates.length
    if(!_.isArray(models)) {
      models = [models]
    }
    var templates = _.map(models, function(model) {
       return new this.Template(model)
    }, this)

    ;[].splice.apply(this.templates, [opts.at, 0].concat(templates))

    var doms = _.map(templates, function(template) {
       return template.template[0]
    })
    var children = this.container.children()
    if(children.length)
      $(doms).insertAfter(children[opts.at - 1])
    else
      this.container.append($(doms))

    this.length = templates.length
  }
   
  Collection.prototype.push = function(data) {
    if(_.isArray(data)) {
      return _(data).each(this.push, this)
    }
    var template = new this.Template(data)

    this.templates.push(template)
    this.container.append(template.template)
    this.length = this.templates.length
  }
   
  return Collection
}

module.exports = CollectionFactory