/* jslint node: true */
'use strict';

var React = require('react');
var ReactDom = require('react-dom');
var MapboxSocket = require('lightstream-socket').MapboxSocket;
var VelomaggCollection = require('./VelomaggCollection');
var MapQuadtree = require('../lib/MapQuadtree');
var BoundingBox = require('../lib/BoundingBox');
var L = require('mapbox.js');

var VeloMap = require('./VeloMap.jsx');

function MapFlow(config, i18n) {
  this.config = config;
  this.i18n = i18n;
}

MapFlow.prototype.setUp = function setUp() {
  this.velomagg = new VelomaggCollection();

  this._initializeMap();
  this._initializeQuadtree();
  this._createLayer();
  this._openSocket();
};

MapFlow.prototype._initializeMap = function _initializeMap() {
  var leaflet_bounds = L.latLngBounds(
    L.latLng(this.config.bounding_box.south_west[1],this.config.bounding_box.south_west[0]),
    L.latLng(this.config.bounding_box.north_east[1],this.config.bounding_box.north_east[0])
  );
  this.map = L.mapbox.map('map')
    .fitBounds(leaflet_bounds);
};

MapFlow.prototype._initializeQuadtree = function _initializeQuadtree() {
  var bounds = this._fixedQuadtreeBounds();
  var quadtree = this.quadtree = new MapQuadtree(bounds, 1);

  this.velomagg.on('add', function (model) {
    quadtree.addItem(model);
  });
};

MapFlow.prototype._fixedQuadtreeBounds = function _fixedQuadtreeBounds() {
  return new BoundingBox(
    this.config.bounding_box.south_west[0],
    this.config.bounding_box.south_west[1],
    this.config.bounding_box.north_east[0],
    this.config.bounding_box.north_east[1]);
};

MapFlow.prototype._createLayer = function _createLayer() {
  var mapElement = React.createElement(VeloMap, {
    quadtree: this.quadtree,
    map: this.map,
    config: this.config,
    i18n: this.i18n
  });
  ReactDom.render(mapElement, document.getElementById('map-component'));
};

MapFlow.prototype._openSocket = function _openSocket() {
  var options = {
    retry_interval: 5000
  };
  var socket = new MapboxSocket('ws://' + this.config.hostname + '/socket/', 'station', options);

  socket.on('opened', function () {
    socket.attachMap(this.map);
  }.bind(this));

  socket.on('new_items', function (station) {
    this.velomagg.set([station], { remove:false });
  }.bind(this));

  socket.on('error', function (error) {
    console.log('error in socket', error);
  });

  socket.on('closed', function () {
    console.log('socket has been closed');
  });

  socket.connect();
};

module.exports = MapFlow;
