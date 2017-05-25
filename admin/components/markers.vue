<template>
    <div>
        <div class="row">
            <div class="col">
                <p class="display-4">List of markers:</p>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <table class="table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Area</th>
                            <th>Location</th>
                            <th>Controls</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-for="(marker, index) in markers">
                            <tr>
                                <th scope="row">{{ index }}</th>
                                <td>{{ marker.title }}</td>
                                <td>{{ marker.description }}</td>
                                <td>{{ marker.level }}</td>
                                <td>{{ marker.location }}</td>
                                <td>
                                    <div class="btn-group" role="group" aria-label="Marker controls">
                                        <button type="button" class="btn btn-sm btn-primary" :data-marker="marker.fbId" v-on:click="openEditDialog">
                                            <i class="fa fa-pencil-square-o" aria-hidden="true"></i>
                                        </button>
                                        <button type="button" class="btn btn-sm btn-danger" :data-marker="marker.fbId" v-on:click="openDeleteDialog">
                                            <i class="fa fa-trash-o" aria-hidden="true"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>
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
                        <p>Are you sure you want ot delete marker {{ activeMarker.fbId }}?</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" id="delete-modal-ok" v-on:click="deleteMarker">Delete</button>
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
                                <input type="text" class="form-control" id="edit-modal-title" :value="activeMarker.title">
                            </div>
                            <div class="form-group">
                                <label for="edit-modal-description" class="form-control-label">Description:</label>
                                <input type="text" class="form-control" id="edit-modal-desc" :value="activeMarker.description">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" id="edit-modal-ok" v-on:click="editMarker">Apply</button>
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

var MarkersViewComponent = {
    data() {
        return {
            markers: [],
            activeMarker: {
                fbId: 0,
                title: "undefined",
                description: "undefined"
            }
        }
    },
    computed: {

    },
    mounted: function () {
        this.fetchMarkers();
    },
    methods: {
        fetchMarkers: function () {
            const fetchMarkersURL = "/api/markers/";
            axios.get(fetchMarkersURL).then(function (response) {
                this.markers = response.data.items;
            }.bind(this)).catch(function (error) {
                console.log(error);
            });
        },
        openEditDialog: function (event) {
            var markerID = event.target.dataset.marker;
            this.activeMarker = this.findMarkerById(markerID);
            $('#edit-modal').modal('show');
        },
        openDeleteDialog: function (event) {
            var markerID = event.target.dataset.marker;
            this.activeMarker = this.findMarkerById(markerID);
            $('#delete-modal').modal('show');
        },
        editMarker: function (event) {
            const markerURL = "/api/markers/" + this.activeMarker.fbId + "/";
            const newTitle = $('#edit-modal-title').val();
            const newDescription = $('#edit-modal-desc').val();
            axios.put(markerURL, {
                title: newTitle,
                description: newDescription
            }).then(function (response) {
                $('#edit-modal').modal('hide');
                this.fetchMarkers();
            }.bind(this)).catch(function (error) {
                console.log(error);
            });
        },
        deleteMarker: function (event) {
            const markerURL = "/api/markers/" + this.activeMarker.fbId + "/";
            axios.delete(markerURL).then(function (response) {
                $('#delete-modal').modal('hide');
                this.fetchMarkers();
            }.bind(this)).catch(function (error) {
                console.log(error);
            });
        },
        findMarkerById: function (id) {
            var result = null;
            for (var i = 0; i < this.markers.length; i++) {
                if (this.markers[i].fbId === id) {
                    result = this.markers[i];
                    break;
                }
            }
            return result;
        }
    },
    components: {

    }
}

module.exports = MarkersViewComponent;
</script>