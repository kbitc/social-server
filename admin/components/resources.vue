<template>
    <div>
        <div class="row">
            <div class="col">
                <p class="display-4">Resources</p>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <form>
                    <div class="form-group">
                        <label for="picture-upload">Picture upload</label>
                        <input type="file" class="form-control-file" id="picture-upload" aria-describedby="picture-upload-desc">
                        <small id="picture-upload-desc" class="form-text text-muted">Select a file on your computer.</small>
                    </div>
                </form>
            </div>
        </div>
        <div class="row card-deck">
            <template v-for="resource in resources">
                <div class="col-2">
                    <div class="card">
                        <img class="card-img-top" src="..." alt="Card image cap">
                        <div class="card-block">
                            <h4 class="card-title">Card title</h4>
                            <p class="card-text">This is a wider card with supporting text below as a natural lead-in to additional content. This content is a little bit longer.</p>
                        </div>
                        <div class="card-footer">
                            <small class="text-muted">Last updated 3 mins ago</small>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>

</style>

<script>
const axios = require('axios');

var ResourcesViewComponent = {
    data() {
        return {
            resources: []
        }
    },
    computed: {

    },
    mounted: function () {
        this.fetchResources();
    },
    methods: {
        fetchResources: function() {
            const fetchResourcesURL = "/api/resources/";
            axios.get(fetchResourcesURL).then(function (response) {
                this.resources = response.data.items;
            }.bind(this)).catch(function (error) {
                console.log(error);
            });
        }
    },
    components: {

    }
}

module.exports = ResourcesViewComponent;
</script>