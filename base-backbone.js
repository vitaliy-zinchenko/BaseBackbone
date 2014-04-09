(function(root, factory){
    if (typeof define === 'function' && define.amd){
        define('baseBackbone', ['backbone'], function(Backbone){
            console.log('define of base backbone');
            return factory(Backbone);
        });
    } else {
        checkDependencies(root.Backbone, root._);
        root.BaseBackbone = factory(root.Backbone, root._);
    }

    function checkDependencies(Backbone, _){
        checkDependency(Backbone, 'Backbone');
        checkDependency(_, 'underscore');
    }

    function checkDependency(dep, depName){
        if(!dep) throw new Error("The '"+depName+"' library should be should be included");
    }

})(this, function(Backbone, _){
    var BaseBackbone = {};
    BaseBackbone.prototype = Backbone;

    /**
     define(['common/views/BaseView',
     'text!/template.dust'],
     function(BaseView, templateSources){

                var SomeView = BaseView.extend({
                    template:{
                        name: 'templateName.template',
                        source: templateSources
                    },
                    events: {

                    },
                    initialize: function(){

                    }
                });
                return SomeView;
            });
     */
    BaseBackbone.BaseView = Backbone.View.extend({
        render: function () {
            this.$el.html(this.renderTemplate());
            this.afterRender();
            return this;
        },
        renderTo: function (element) {
            this.$el.html(this.renderTemplate());
            this.afterRender();
            this.$el.appendTo(element);
        },
        eventManager: _.extend({}, Backbone.Events),
        afterRender: function(){},
        renderTemplate: function () {
            //TODO need optimization
            this.template;
            var compiled = dust.compile(this.template.source,
                this.template.name);
            dust.loadSource(compiled);
            var rendered;
            dust.render(this.template.name,
                this.model && this.model.toJSON(),
                function (err, out) {
                    rendered = out;
                });
            return rendered;
        }
    });

    BaseBackbone.BaseModel = Backbone.Model.extend({
        initialize: function(){
            console.log('created BaseModel');
            this.on('error', function(model, resp, options){
                console.log(model);
                console.log(resp);
                console.log(options);
                if(resp.status == 500) new ModalWinView({
                    content: "Server error!",
                    buttons: [
                        {
                            'label': 'OK',
                            'classes': 'btn-primary close-modal'
                        }
                    ]
                });
            });
        },
        url: function(){
            if(this.get('id')) return this.baseUrl + '/' + this.get('id');
            return this.baseUrl;
        },
        isNew: function() {
            //TODO | need refactoring
            if(this.get('id').length == 0){
                return true;
            }else{
                return false;
            }
        },
        save: function(options){
            options = options || {};
            options.url = options.url || this.baseUrl
            return Backbone.Model.prototype.save.call(this, null, options, null);
        },
        toJSON: function(options){
//                return _.clone(this.attributes);
            var json = {};
            for(var field in this.attributes){
                var current = this.attributes[field];
                if(current instanceof Backbone.Model ||
                    current instanceof Backbone.Collection){
                    json[field] = current.toJSON();
                } else {
                    json[field] = current;
                }
            }
            return json;
        }
    });
    BaseBackbone.BaseCollection = Backbone.Collection.extend({
        parse: function (response, options) {
            console.log("BaseCollection.parse()");
            var list = [];
            _.each(response, function (response) {
                var hash = this.model.prototype.parse(response);
                list.push(new this.model(hash));
            }, this);
            return list;
        },
        toJSON: function(){
            var json = new Array();
            _.each(this.models, function(current){
                if(current instanceof Backbone.Model ||
                    current instanceof Backbone.Collection){
                    json.push(current.toJSON());
                } else {
                    json.push(current);
                }
            }, this)
            return json;
        }
    });
    console.log('BaseBackbone factory')
    return BaseBackbone;
})