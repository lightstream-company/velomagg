/* jslint node: true */
'use strict';

var Cluster = require('../lib/Cluster');

var StationCluster = Cluster.extend({
  changedValues: function (item) {
    return item.data().available_bikes - item._previousAttributes.data.available_bikes;
  },
  name: function () {
    return this.isACluster() ?
      this.clusterSize() + ' stations':
      this.data()[0].name;
  },
  availableBikes: function () {
    return this.data().reduce(function (sum, station_data) {
      return sum += station_data.available_bikes;
    }, 0);
  },
  total: function () {
    return this.data().reduce(function (sum, station_data) {
      return sum += station_data.total;
    }, 0);
  },
  freeSlots: function () {
    return this.data().reduce(function (sum, station_data) {
      return sum += station_data.free_slots;
    }, 0);
  },
  isACluster: function () {
    return this.clusterSize() > 1;
  },
  clusterSize: function () {
    return this.length;
  }
});

module.exports = StationCluster;
