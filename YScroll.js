(function (root, factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        // COMMONJS
        module.exports = factory();
    } else {
        // BROWSER
        root.YScroll = factory();
    }
}(this, function () {

    'use strict';

    var defaults = {
        wrapper: '#YScroll',
        autoPlay: false,
        interTime: 2500,
        prevCell: ".prev",
        nextCell: ".next",
        sizeDatas: [],
        centerX: 0,
        centerY: 0,
        a: 0, //半径：宽
        b: 0, //半径：高
        style: 1, //展示的样式 1:默认  2:两侧对称
    };
    /**
     * Merge two or more objects. Returns a new object.
     * @param {Object}   objects  The objects to merge together
     * @returns {Object}          Merged values of defaults and options
     */
    var extend = function () {
        // Variables
        var extended = {};
        var deep = false;
        var i = 0;
        var length = arguments.length;

        // Merge the object into the extended object
        var merge = function (obj) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    extended[prop] = obj[prop];
                }
            }
        };
        // Loop through each object and conduct a merge
        for (; i < length; i++) {
            var obj = arguments[i];
            merge(obj);
        }
        return extended;
    };


    var YScroll = function () {
        this.wrapper = '';
        this.CardNumber = 0; //生成点的个数, 根据外部的li个数来确定
        this.arc = 360; //弧度: 默认360
        this.cardWidth = 0, //卡片宽度
        this.cardHeight = 0, //卡片高度
        this.sizeDatas = [];
    };
    YScroll.prototype = {
        conBox: null,
        nextBtn: null,
        prevBtn: null,
        timer: null,
        init: function (options) {
            this.settings = extend(defaults, options || {});
            this.wrapper = document.querySelector(this.settings.wrapper);
            this.sizeDatas = this.settings.sizeDatas;

            var wapperJQ = $(this.wrapper);
            self.conBox = $("ul li", wapperJQ);
            self.nextBtn = $(this.settings.nextCell);
            self.prevBtn = $(this.settings.prevCell);

            this.cardWidth = self.conBox.width();
            this.cardHeight = self.conBox.height();
            if (this.settings.centerX <= 0) {
                this.settings.centerX = wapperJQ.width() / 2 + this.cardWidth * 0.1;
            }
            if (this.settings.centerY <= 0) {
                this.settings.centerY = wapperJQ.height() / 2 * 0.65;
            }

            if (this.wrapper === "undefined") {
                return false;
            }
            this.attachEvent();
            if (this.sizeDatas.length<=0) {
                this.applyEllipse();   
            }
            this.animate();
            this.doPlay();
        },
        animate: function () {
            for (var i = 0; i < this.sizeDatas.length; i++) {
                var data = this.sizeDatas[i];
                self.conBox.eq(i).css('z-index', data['z-index']);
                self.conBox.eq(i).stop().animate(data, 500);
            }
        },
        nextCad: function () {
            var first = YScroll.sizeDatas.shift();
            YScroll.sizeDatas.push(first);
            YScroll.animate();
        },
        prevCad: function () {
            var first = this.sizeDatas.pop();
            this.sizeDatas.unshift(first);
            this.animate();
        },
        doPlay: function () {
            /*自动播放*/
            if (this.settings.autoPlay) {
                clearInterval(this.timer);
                var ws = this;
                this.timer = setInterval(function () {
                    ws.nextCad();
                }, this.settings.interTime);
            }
        },
        applyEllipse: function () {
            this.CardNumber = self.conBox.length;

            var pnC = Math.floor(this.arc / this.CardNumber),
                cose1 = 0.22,
                scaleX,
                lastScale;

            for (var i = 0; i < this.CardNumber; i++) {
                var factor = (this.CardNumber - i) >= i,
                    xCode = factor ? i : this.CardNumber - i;

                switch (this.settings.style) {
                    case 1:
                        {
                            //尺寸系数 --1
                            scaleX = 1 - xCode * (factor ? cose1 *= 0.9 : cose1 /= 0.92);
                        }
                        break;
                    case 2:
                        {
                            //尺寸系数 --2 -对称   i太大会导致尺寸过小
                            scaleX = 1 - xCode * 0.12;
                            if (scaleX < 0.2) {scaleX = lastScale;} //防止尺寸太小
                            lastScale = scaleX;
                        }
                    default:
                        break;
                }
                var hudu = (Math.PI / 180) * (i * pnC),
                    x1 = this.settings.centerX - this.settings.a * Math.sin(hudu),
                    y1 = this.settings.centerY + (this.settings.b * Math.cos(hudu)),
                    zIndex = factor ? this.CardNumber - i : i,
                    elopacity = 1 - 0.02 * xCode, //透明度
                    width = scaleX * this.cardWidth,
                    height = scaleX * this.cardHeight;
                this.sizeDatas[i] = {
                    'z-index': zIndex,
                    opacity: elopacity,
                    scaleX: scaleX,
                    width: width,
                    height: height,
                    top: y1,
                    left: x1 - width * (1 - scaleX / 2)
                };

                //调试代码
                // var divs = document.createElement("div");
                // divs.innerHTML = Math.floor(width);
                // divs.className = "ellipse";
                // divs.style.cssText = "left:"+x1 +"px;top:"+y1 +"px; position: absolute;width: 3px;height: 3px;color: red;background:yellow; z-index:1000;"
                // $(this.wrapper).append(divs);
            };
            console.log(this.sizeDatas);
        },
        attachEvent: function () {
            var ws = this;
            if (self.nextBtn) {
                self.nextBtn.click(this.nextCad);
            } /* 上下 两种处理方式，这里会丢失this */
            if (self.prevBtn) {
                self.prevBtn.click(this.prevCad.bind(this));
            }
            $(this.settings.wrapper).on({
                mouseenter: function () {
                    $('.arrow').css('display', 'block');
                    clearInterval(ws.timer);
                },
                mouseleave: function () {
                    $('.arrow').css('display', 'none');
                    ws.doPlay();
                }
            })
        }
    }
    var YScroll = new YScroll();

    return YScroll;
}));