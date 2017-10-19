<template>
    <div>
        <div class="row">
            <div class="col">
                <p class="display-4">Resources</p>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <form enctype="multipart/form-data">
                    <div class="form-group">
                        <label for="picture-upload">Picture upload</label>
                        <input type="file" class="form-control-file" id="picture-upload" aria-describedby="picture-upload-desc">
                        <small id="picture-upload-desc" class="form-text text-muted">Select a file on your computer.</small>
                    </div>
                    <button type="submit" class="btn btn-primary" v-on:click="handleUpload">Submit</button>
                </form>
            </div>
        </div>
        <div class="row card-deck mt-1">
            <template v-for="resource in resources">
                <div class="col-3">
                    <div class="card">
                        <img class="card-img-top img-fluid" :src="resource.url" alt="Card image cap">
                        <div class="card-block">
                            <h5 class="card-title">{{ resource.filename }}</h5>
                            <p class="card-text">Title: {{ resource.title == "" ? "Undefined" : resource.title}}</p>
                            <p class="card-text">Author: {{ resource.author == "" ? "Undefined" : resource.author}}</p>
                            <p class="card-text">Level: {{ resource.level }}</p>
                            <p class="card-text">Assigned: {{ (resource.assigned == 0 ? "Not assigned": resource.assigned) }}</p>
                            <p class="card-text">Order: {{ resource.order }}</p>
                            <p class="card-text">Likes: {{ resource.likes }}</p>
                            <div class="btn-group" role="group" aria-label="Marker controls">
                                <button type="button" class="btn btn-sm btn-primary" :data-res="resource.res" v-on:click="openEditDialog">
                                    <i class="fa fa-pencil-square-o" aria-hidden="true"></i>
                                </button>
                                <button type="button" class="btn btn-sm btn-danger" :data-res="resource.res" v-on:click="openDeleteDialog">
                                    <i class="fa fa-trash-o" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>
                        <div class="card-footer">
                            <small class="text-muted">Uploaded on {{ new Date(resource.ts).toLocaleDateString() }} at {{ new Date(resource.ts).toLocaleTimeString() }}</small>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    
        <!-- Delete dialog -->
        <div class="modal fade" id="delete-modal">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Virtual Library</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p>Are you sure you want ot delete resource {{ activeResource.filename }}?</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" id="delete-modal-ok" v-on:click="remove">Delete</button>
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    
        <!-- Edit dialog -->
        <div class="modal fade" id="edit-modal">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Virtual Library</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form>
                            <div class="form-group">
                                <label for="edit-modal-title" class="form-control-label">Title:</label>
                                <input type="text" class="form-control" id="edit-modal-title" :value="activeResource.title">
                            </div>
                            <div class="form-group">
                                <label for="edit-modal-author" class="form-control-label">Author:</label>
                                <input type="text" class="form-control" id="edit-modal-author" :value="activeResource.author">
                            </div>
                            <div class="form-group">
                                <label for="edit-modal-assigned" class="form-control-label">Assigned:</label>
                                <input type="number" class="form-control" id="edit-modal-assigned" :value="activeResource.assigned">
                            </div>
                            <div class="form-group">
                                <label for="edit-modal-order" class="form-control-label">Order:</label>
                                <input type="number" class="form-control" id="edit-modal-order" :value="activeResource.order">
                            </div>
                            <div class="form-group">
                                <label for="dit-modal-level" class="form-control-label">Level:</label>
                                <select class="form-control" id="edit-modal-level" :value="activeResource.level">
                                    <option value="All">All</option>
                                    <option value="MainLibrary">MainLibrary</option>
                                    <option value="Forest">Forest</option>
                                    <option value="Cave">Cave</option>
                                    <option value="Future">Future</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" id="edit-modal-ok" v-on:click="edit">Apply</button>
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.fa {
    pointer-events: none;
}
</style>

<script>
const axios = require('axios');

var ResourcesViewComponent = {
    data() {
        return {
            resources: [],
            activeResource: {}
        }
    },
    computed: {

    },
    mounted: function () {
        this.fetchResources();
    },
    methods: {
        fetchResources: function () {
            const resourcesURL = "/api/resources/";
            axios.get(resourcesURL).then(function (response) {
                this.resources = response.data.items;
                this.activeResource = {};
            }.bind(this)).catch(function (error) {
                console.log(error);
            });
        },
        handleUpload: function (event) {
            // Form package
            var files = document.getElementById('picture-upload').files;
            if (files.length > 0) {
                const resourcesURL = "/api/resources/";
                var data = new FormData();
                data.append('file', files[0]);
                const config = {
                    headers: { 'content-type': 'multipart/form-data' }
                }
                axios.post(resourcesURL, data, config).then(function (response) {
                    this.fetchResources();
                }.bind(this)).catch(function (error) {
                    console.log(error);
                });
            }
        },
        openDeleteDialog: function (event) {
            var res = event.target.dataset.res;
            this.activeResource = this.findResource(res);
            $('#delete-modal').modal('show');
        },
        openEditDialog: function (event) {
            var res = event.target.dataset.res;
            this.activeResource = this.findResource(res);
            $('#edit-modal').modal('show');
        },
        remove: function (event) {
            const resourcesURL = "/api/resources/" + this.activeResource.res + "/";
            axios.delete(resourcesURL).then(function (response) {
                $('#delete-modal').modal('hide');
                this.fetchResources();
            }.bind(this)).catch(function (error) {
                console.log(error);
            });
        },
        edit: function (event) {
            const resourcesURL = "/api/resources/" + this.activeResource.res + "/";
            const newTitle = $('#edit-modal-title').val();
            const newAuthor = $('#edit-modal-author').val();
            const newAssigned = parseInt($('#edit-modal-assigned').val());
            const newLevel = $('#edit-modal-level').val();
            const newOrder = parseInt($('#edit-modal-order').val());
            axios.put(resourcesURL, {
                assigned: newAssigned,
                level: newLevel,
                title: newTitle,
                author: newAuthor,
                order: newOrder
            }).then(function (response) {
                $('#edit-modal').modal('hide');
                this.fetchResources();
            }.bind(this)).catch(function (error) {
                console.log(error);
            });
        },
        findResource: function (res) {
            var result = null;
            for (var i = 0; i < this.resources.length; i++) {
                if (this.resources[i].res === res) {
                    result = this.resources[i];
                    break;
                }
            }
            return result;
        }
    },
    components: {

    }
}

module.exports = ResourcesViewComponent;
</script>