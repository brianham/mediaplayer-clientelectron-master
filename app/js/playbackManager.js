//const log = require('../common/logger').default;
const EventEmitter = require('events').EventEmitter;
const util = require('util');

function PlaybackManager() {
    this._currentItem = null;
    this._nextItem = null;
}

PlaybackManager.prototype = {

    constructor: PlaybackManager,

    initialize: function(currentItem, nextItem) {    
        try {
            this._currentItem = currentItem;
            this._nextItem = nextItem;
        } catch(error) {
            //log.error(error);
        }
    },

    play: function() {    
        try {
            this.emit('message', 'message from PlaybackManager');
        } catch(error) {
            //log.error(error);
        }
    },

    queueNext: function(nextItem) {    
        try {

        } catch(error) {
            //log.error(error);
        }
    },

}

// Inherit from EventEmitter
util.inherits(PlaybackManager, EventEmitter);

module.exports = PlaybackManager;