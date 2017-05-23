var Vue = require('vue');
var VueRouter = require('vue-router');

// Vue single file components
var Hello = require('./components/hello.vue');

Vue.use(VueRouter);

const router = new VueRouter({
    routes: [
        { path: '/', component: Hello }
    ],
    linkActiveClass: "active"
});

var vue = new Vue({
    router: router
}).$mount('#content');