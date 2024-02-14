


Canvas.TEXT_HEIGHT = 14;
Canvas.BACKGROUND_COLOR = "#FFFFFF";
Canvas.FOREGROUND_COLOR = "#000000";
Canvas.HIGHLIGHT_COLOR = "#FF0000";


function Canvas(canvas)
{
    if (!(canvas instanceof HTMLElement)) {
        canvas = document.getElementById(canvas || "canvas");
    }
    this.canvas = canvasElem;
    this.ctx = this.canvas.getContext('2d');

    this.textHeight = Canvas.TEXT_HEIGHT;
    // this.backgroundColor 

    this.strokeLine = function(x0, y0, x1, y1, params) 
    {
        this.ctx.strokeStyle = this.ctx.fillStyle = params && params.color || this.lineColor;
        this.ctx.lineWidth = params && params.width || this.lineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(Math.round(x0), Math.round(y0)); 
        this.ctx.lineTo(Math.round(x1), Math.round(y1));
        this.ctx.closePath();
        this.ctx.stroke();
    }
    
    this.strokeRect = function(x0, y0, x1, y1) 
    {
        this.strokeLine(x0, y0, x1, y0);
        this.strokeLine(x0, y0, x0, y1);
        this.strokeLine(x1, y0, x1, y1);
        this.strokeLine(x0, y1, x1, y1);
    }
    
    this.fillRect = function(x0, y0, x1, y1) 
    {
        x0 = Math.round(x0); x1 = Math.round(x1); y0 = Math.round(y0); y1 = Math.round(y1);
        this.ctx.beginPath();
        if (radius) this.ctx.roundRect(x0, y0, x1-x0, y1-y0, radius);
        else ctx.rect(x0, y0, x1-x0, y1-y0);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        // this.strokeRect(x0, y0, x1, y1);
    }
    
    this.strokeCircle = function(x, y, radius, fill) 
    {
        ctx.beginPath();
        ctx.arc(Math.round(x), Math.round(y), Math.round(radius), 0, Math.PI*2);
        ctx.closePath();
        if (fill) ctx.fill();
        ctx.stroke();
    }
    
    this.fillCircle = function(x, y, radius) 
    {
        this.strokeCircle(x, y, radius, true);
    }
    
    
}


