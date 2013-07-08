/*global SnaprFX: false, debug_logging: false, debug_canvas: false */

/**
 * gets an image file and reads its pixels
 * based on http://matthewruddy.github.com/jQuery-filter.me/
 * @param {Object} options.
 * @constructor
 */
SnaprFX.Canvas = function(options){  var self = this;
    if(debug_logging){ console.log('canvas', options); }

    self.options = options;

    self.deferred = $.Deferred();  // to notify when read to read

    // create canvas
    self.canvas = document.createElement('canvas');
    self.context = self.canvas.getContext('2d');

    if(debug_canvas){
        $(document.body).append(self.canvas);
        $(self.canvas).css({border: '1px solid #f00', width: 200});
    }

    // no image url, stop here
    if(!options.url){
        self.width = self.canvas.width = options.width;
        self.height = self.canvas.height = options.height;
        self.deferred.resolve();
        return;
    }

    if(debug_logging){ console.time('get image'); }

    // correct orientation
    switch (options.orientation){
        case 3:
            self.options.rotation = Math.PI;
            break;
        case 6:
            self.options.rotation = Math.PI * 0.5;
            break;
        case 8:
            self.options.rotation = Math.PI * 1.5;
            break;
        default:
            self.options.rotation = 0;
    }

    // get image
    self.image = new Image();
    self.image.src = options.url;

    self.image.onload = function(){
        self.place_image().done(function(){
            self.deferred.resolve();
        });
    };

};

SnaprFX.Canvas.prototype.place_image = function() {  var self = this;

    var deferred = $.Deferred();

    self.image.aspect = self.image.width/self.image.height;
    var x1 = 0,
        y1 = 0,
        x2 = self.image.width,
        y2 = self.image.height;
    if(self.options.size){
        if(self.options.aspect){
            var chop;
            if(self.image.aspect > self.options.aspect){
                self.height = self.canvas.height = self.options.size;
                self.width = self.canvas.width = self.height * self.options.aspect;
                chop = self.image.width - (self.image.height * self.options.aspect);

                x1 = chop/2;
                x2 = self.image.width-chop;
            }else{
                self.width = self.canvas.width = self.options.size;
                self.height = self.canvas.height = self.width / self.options.aspect;
                chop = (self.image.height - (self.image.width / self.options.aspect));

                y1 = chop/2;
                y2 = self.image.height-chop;
            }
        }else{
            if(self.image.aspect > 1){
                self.width = self.canvas.width = self.options.size;
                self.height = self.canvas.height = self.width / self.image.aspect;
            }else{
                self.height = self.canvas.height = self.options.size;
                self.width = self.canvas.width = self.height * self.image.aspect;
            }
        }
    }else{
        // scale canvas to image size
        self.width = self.canvas.width = self.options.width || self.image.width;
        self.height = self.canvas.height = self.options.height || self.image.height;
    }

    // Draw the image onto the canvas
    self.context.translate(self.canvas.width/2, self.canvas.height/2);
    self.context.rotate(self.options.rotation);
    self.context.drawImage(self.image, x1, y1, x2, y2, self.canvas.width/-2, self.canvas.height/-2, self.canvas.width, self.canvas.height);
    self.context.rotate(-self.options.rotation);
    self.context.translate(self.canvas.width/-2, self.canvas.height/-2);

    // notify that it's ready
    deferred.resolve();

    if(debug_logging){ console.timeEnd('get image'); }

    return deferred;
};

SnaprFX.Canvas.prototype.get_data = function(){
    var image_data = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    // if you ever overwrite this it seems you can't write the px back to the canvas
    this.data = image_data;
    return image_data.data;
};

SnaprFX.Canvas.prototype.put_data = function(data) {
    this.data.data = data;
    this.context.putImageData(this.data, 0, 0);
    return this;
};

SnaprFX.Canvas.prototype.get_data_url = function() {
    return this.canvas.toDataURL( 'image/jpeg', 1.0 );
};

SnaprFX.Canvas.prototype.clear = function() {
    // setting width clears and resets canvas
    this.canvas.width = this.canvas.width;
};

SnaprFX.Canvas.prototype.set_size = function(width, height) {  var self = this;
    if(self.canvas.width != width){
        self.width = width;
        self.options.width = width;
        self.canvas.width = width;
    }
    if(self.canvas.height != height){
        self.height = height;
        self.options.height = height;
        self.canvas.height = height;
    }
    if(self.image){
        return self.place_image();
    }else{
        return $.Deferred().resolve();
    }
};

SnaprFX.Canvas.prototype.clone = function(options) {  var self = this;
    return new SnaprFX.Canvas($.extend({}, self.options, options));
};