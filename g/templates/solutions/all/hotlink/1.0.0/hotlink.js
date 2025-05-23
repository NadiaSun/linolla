(function () {
    var cookie = {
        DEBUG: true, domain: null, setDomain: function (domain) {
            this.domain = domain;
        }, _getDomainStr: function (domain) {
            domain = domain || this.domain;
            if (!domain || domain == document.location.host || !~document.location.host.indexOf(domain.substr(1))) {
                return '';
            } else {
                return '; domain=' + domain;
            }
        }, get: function (name) {
            if (name) {
                var find_cookie = document.cookie.match(new RegExp('(?:' + name + ')=(.*?)(?:;|$)', 'i'));
                if (find_cookie) {
                    return find_cookie[1];
                } else {
                    return null;
                }
            }
            return false;
        }, set: function (name, value, seconds, domain) {
            var date, expires = '';
            if (seconds) {
                date = new Date();
                date.setTime(date.getTime() + (seconds * 1000));
                expires = '; expires=' + date.toGMTString();
            }
            var set_str = name + '=' + value + expires + this._getDomainStr(domain) + '; path=/';
            document.cookie = set_str;
        }, remove: function (name, domain) {
            if (this.get(name)) {
                var rem_str = name + "=; expires=Thu, 01-Jan-70 00:00:01 GMT'" + this._getDomainStr(domain) + "; path=/";
                document.cookie = rem_str;
                return true;
            } else {
                return false;
            }
        }, 'delete': function (name) {
            return this.remove(name);
        }
    };
    cookie.setDomain('.' + document.location.host);
    var hotlink = {
        links: {},
        lock: false,
        block: null,
        input: null,
        max_digits: 0,
        values: [],
        ttl: 150,
        serial_touches: [],
        _main_template: '<div class="transition-block">' + '<div class="transition-heading">Быстрый переход</div>' + '<div class="transition-total clearfix">' + '<input type="text" class="transition-numbers" id="transition-numbers" maxlength="5">' + '<div class="transition-btns">' + '<button type="submit" href="javascript:;" class="transition-submit">Перейти</button>' + '<button type="reset" href="javascript:;" class="transition-cancel"><span>Отмена (Esc)</span></button>' + '</div>' + '</div>' + '</div>',
        init: function (max_digits) {
            if (!window['$'] || !window['jQuery']) {
                return false;
            }
            if (this.isPartner()) {
              	return false;
            }
            if (window.HOTLINKS) {
                this.links = window.HOTLINKS;
            }
            if (max_digits) {
                this.max_digits = max_digits;
            } else {
                for (var digit in this.links) {
                    if (this.links.hasOwnProperty(digit)) {
                        if (digit.toString().length > this.max_digits) {
                            this.max_digits = digit.toString().length;
                        }
                    }
                }
            }
            this.createBlock();
            var self = this;
            $(document).bind('keydown', function (e) {
                if (e.altKey && e.keyCode === 82) {
                    self.getTemporaryHotLinkId();
                    return;
                }
                self.check(e);
                self.checkLength();
            });
            self.input.bind('blur', function () {
                if (self.block.css('display') !== 'none') {
                    self.input.focus();
                }
            });
            $(document).bind('mouseup touchend', function (e) {
                self.checkLength();
            });
            this.block.find('.transition-digits-block td a').bind('click', function () {
                var btn = $(this);
                btn.addClass('transition-digit-pressed');
                if (btn.pressed_timer) {
                    window.clearTimeout(btn.pressed_timer);
                }
                btn.pressed_timer = setTimeout(function () {
                    btn.removeClass('transition-digit-pressed');
                }, 200);
                if (parseInt(this.innerHTML) >= 0) {
                    self.input.val(self.input.val() + this.innerHTML);
                    self.checkLength();
                } else {
                    var cur_value = self.input.val();
                    self.input.val(cur_value.substr(0, (cur_value.length - 1)));
                }
            });
            this.block.find('.transition-submit').bind('click', function () {
                self.go();
            });
            this.block.find('.transition-cancel').bind('click', function () {
                self.cancel();
            });
            if (cookie.get('hotlink-show-numbers')) {
                self.makeRequest('///hotlink/hotlink.php?command=getHotLinkId&link=' + encodeURIComponent(document.location.href));
            }
            return true;
        },
        reset: function () {
            this.input.val('');
        },
        cancel: function () {
            var self = this;
            setTimeout(function () {
                self.reset();
                $(self.block).hide();
            }, self.ttl);
        },
        show: function () {
            $(this.block).show();
            this.input.focus();
        },
        createBlock: function () {
            if (!this.block) {
                var block = $('<div>');
                block.attr('id', 'hotlink-block');
                block.addClass('transition-overlay');
                block.html(this._main_template);
                this.block = block;
                $('body').append(block);
                this.input = $('#transition-numbers');
            }
        },
        isPartner: function() {
          	var urlParams = new URLSearchParams(window.location.search);
          	return urlParams.get('src') ? true : false;
        },
        isWorking: function () {
            return (this.block.css('display') !== 'none');
        },
        check: function (e) {
            if ((e.target.nodeName == 'INPUT' || e.target.nodeName == 'TEXTAREA') && e.target.className != 'transition-numbers') {
                return;
            }
            var c = e.keyCode, num = null;
            if (c >= 48 && c <= 58) {
                num = c - 48;
            } else if (c >= 96 && c <= 106) {
                num = c - 96;
            }
            if (this.isWorking()) {
                if (num !== null && !e.ctrlKey && !e.altKey && !e.shiftKey) {
                } else if (c == 27) {
                    this.cancel();
                } else if (c == 13) {
                    this.go();
                } else if (c == 8) {
                } else if (c == 46) {
                } else if (c >= 35 && c <= 40) {
                } else if (c == 16 || c == 17) {
                } else if (e.ctrlKey || e.altKey || e.shiftKey) {
                } else if (c == 116) {
                } else {
                    e.preventDefault();
                    e.stopPropagation();
                }
            } else if (!this.isWorking() && num !== null && !e.ctrlKey && !e.altKey && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                this.show();
                this.input.val(num);
            }
        },
        checkLength: function () {
            var cur_value = this.input.val();
            var new_value = cur_value.substr(0, this.input.attr('maxlength'));
            if (cur_value != new_value) {
                this.input.val(new_value);
            }
        },
        go: function () {
            if (this.lock) return;
            var self = this;
            var num = self.input.val();
            this.input.css('color', '#000');
            if (!num) return;
            if (num == '99999') {
                if (cookie.get('hotlink-show-numbers')) {
                    cookie.remove('hotlink-show-numbers');
                    $('#transition-num-help').remove();
                } else {
                    cookie.set('hotlink-show-numbers', 1, 60 * 60 * 24 * 365 * 5);
                    self.makeRequest('///hotlink/hotlink.php?command=getHotLinkId&link=' + encodeURIComponent(document.location.href));
                }
                self.input.css('color', '#00f');
                setTimeout(function () {
                    self.input.css('color', '#000');
                    self.cancel();
                }, 500);
                return;
            } else if (num == '666') {
                self.getTemporaryHotLinkId();
                return;
            }
            if (self.links[num]) {
                self.redirect(self.links[num]);
            } else {
                self.makeRequest('///hotlink/hotlink.php?command=getHotLink&link_id=' + encodeURIComponent(num));
            }
        },
        getTemporaryHotLinkId: function () {
            var self = this;
            cookie.set('hotlink-show-numbers', 1, 60 * 60 * 24 * 365 * 5);
            self.makeRequest('///hotlink/hotlink.php?command=getTemporaryHotLinkId&link=' + encodeURIComponent(document.location.href));
            self.input.css('color', '#00f');
            setTimeout(function () {
                self.input.css('color', '#000');
                self.cancel();
            }, 500);
        },
        makeRequest: function (url) {
            var script = $('<script>');
            script.attr('src', url);
            $('head').append(script);
        },
        redirect: function (url) {
            var self = this;
            this.input.css('color', '#568600');
            setTimeout(function () {
                document.location.href = url;
            }, self.ttl);
        },
        error: function () {
            var self = this;
            self.input.css('color', '#f00');
            setTimeout(function () {
                self.input.css('color', '#000');
            }, 500);
        },
        response: function (url) {
            if (isFinite(url)) {
                this.url2code(url);
            } else {
                this.code2url(url);
            }
        },
        code2url: function (url) {
            var self = this;
            if (url) {
                self.redirect(url);
            } else {
                self.error();
            }
        },
        url2code: function (code) {
            if (code && !document.getElementById('transition-num-help')) {
                var code_block = $('<div>');
                code_block.addClass('transition-num-help');
                code_block.attr('id', 'transition-num-help');
                code_block.html('<span>' + code + '</span>');
                $('body').append(code_block);
            }
        }
    };
    window.hotlink = hotlink;
    $(function () {
        hotlink.init(5);
    });
})();