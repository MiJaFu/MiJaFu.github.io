/**
 * Created by Luo on 2019/1/9.
 */
(function ($) {
    "use strict";
    var options = {};
    var isMouseDown = false;
    var startTime = 0;
    var endTime = 0;
    var preSelectRow = "";
    var preSelectCol = "";
    var selectRow = "";
    var clientX = "";
    var clientY = "";
    var mouseMoveX = "";
    var mouseMoveY = "";

    function strOption(option, el) {
        switch (option) {
            case "getData":
                var data = [];
                var tr = el.children('tbody').children();
                $.each(tr, function (i, v) {
                    var thisRowData = {};
                    $.each($(v).children("td"), function (idx, val) {
                        var focusText = $(val).html();
                        if (focusText.indexOf('likeExcelText') != -1) {
                            focusText = $(val).children('input').val();
                        }
                        options.columns[idx].type == "btn" ? "" : thisRowData[options.columns[idx].field] = focusText;
                    });
                    data.push(thisRowData);
                });
                return data;
                break;
            case "reset":
                var blankData = [{}];
                $.each(options.columns, function (i, v) {
                    blankData[0][v.field] = "";
                });
                option.data = blankData;
                el.bootstrapTable({
                    sidePagination: 'client',
                    columns: option.columns,
                    cardView: false,
                    data: option.data
                });
                return;
                break;

        }
    };
    function isMobile() {
        if (navigator.userAgent.match(/(iPhone|iPod|Android|ios)/i)) {
            return true;
        } else {
            return false;
        }
    };
    function excelTable(option, el) {
        this.option = option;
        this.el = el;
        this.init();
        return this;
    };

    excelTable.prototype.init = function () {
        $("body").append('<textArea id="textArea" style="width: 0px;height: 0px;border: none;position: fixed;top: 0;"></textArea>');
        this.initBlankTable();
        this.bindEvent();
    };

    $.fn.excelTable = function (option, callback) {
        if (typeof option == "string") {
            return strOption(option, this);
        } else {
            options = option;
            new excelTable(option, this);
        }
    };


    //初始化空白数据
    excelTable.prototype.initBlankTable = function () {
        var option = this.option;
        var el = this.el;
        if (option.data.length == 0) {
            option.data = [this.BlankRow(), this.BlankRow(), this.BlankRow(), this.BlankRow(), this.BlankRow(), this.BlankRow()];
        }
        el.bootstrapTable({
            sidePagination: 'client',
            columns: option.columns,
            cardView: false,
            data: option.data
        });
    };

    //空白行数据
    excelTable.prototype.BlankRow = function () {
        var el = this.el;
        var blankData = {};
        $.each(this.option.columns, function (i, v) {
            blankData[v.field] = "";
        });
        return blankData;
    };

    //注册事件
    excelTable.prototype.bindEvent = function () {
        var el = this.el;
        var option = this.option;
        var that = this;
        //注册全局点击事件
        $(document)[0].onclick = function (e) {
            isMouseDown = false;
            var e = e || window.event;
            try {
                if ($(e.target).hasClass("likeExcelText") || $(e.target).parents('table')[0].id != el[0].id) {
                    return;
                }
            } catch (e) {
                that.fn_hideDropDownModal();
                el.find(".dropdown-toggle").removeClass("dropdown-toggle");
            }
        };
        $(document).on("mouseup",  function (e) {
            isMouseDown = false;
        });


        $(document).on("click", "#" + el[0].id + "[data-table=excelTable]>tbody>tr>td", function () {
            that.fn_hideDropDownModal();
            if ($(this).hasClass("disabled")) {
                return;
            }
            var index = $(this).index();
            var focusText = $(this).html();
            var tdWidth = $(this).width();
            focusText.indexOf('likeExcelText') != -1 ? focusText = $(this).children('input').val() : focusText;
            var ExcelText = '<input type="text" class="likeExcelText" id="likeExcelText" value="' + focusText + '" style="width: ' + tdWidth + 'px;height: 100%;border: none;background-color: rgba(0,0,0,0);outline: unset;"/>'
            var dropDownContent = '<table id="autocompleteTable"></table>';

            el.find('.tdselect').removeClass("tdselect open");
            // el.find('.dropdown-menu').remove();
            if (option.columns[index].type != "dropdown") {
                el.find(".dropdown-toggle").removeClass("dropdown-toggle");
            }
            if (option.columns[index].type == "autocomplete") {
                var str = focusText;
                $(this).addClass("tdselect open").html(ExcelText + '<div class="dropdown-menu" role="menu">' + dropDownContent + '</div>');
                //初始化autocomplete内容表格
                $("#autocompleteTable").bootstrapTable({
                    sidePagination: 'client',
                    columns: option.autocompleteColumns,
                    cardView: false,
                    data: []
                });
                option.columns[index].source(str, that.setResult);

                var timeout = null;
                $(this).children('input').off("keyup").on("keyup", function () {
                    // String
                    var str = $(this).val();
                    // Timeout
                    if (timeout) {
                        clearTimeout(timeout);
                    }
                    // Delay search
                    timeout = setTimeout(function () {
                        // Search
                        option.columns[index].source(str, that.setResult);
                    }, 500);
                });
            }
            else if (option.columns[index].type == "dropdown") {
                var str = focusText;
                dropDownContent = focusText + '<ul class="dropdown-menu" style="width: ' + ($(this).width() + 16) + 'px"> </ul>';
                if (!$(this).hasClass("dropdown-toggle")) {
                    el.find(".dropdown-toggle").removeClass("dropdown-toggle")

                    $(this).addClass("tdselect open dropdown dropdown-toggle").html(dropDownContent);
                    option.columns[index].source(str, function (data) {
                        that.setDropdownResult(data, that);
                    });
                } else {
                    el.find(".dropdown-toggle").removeClass("dropdown-toggle");
                    $(this).children(".dropdown-menu").remove();
                }
            } else if (option.columns[index].type == "btn") {
                return;
            }
            else {
                $(this).addClass("tdselect");
                $(this).html(ExcelText);
            }

            $(this).children("input").trigger('focus');
            try {
                $(this).children("input")[0].selectionStart = focusText.length;
            } catch (e) {
            }
        });
        //选择autocomplete内容操作
        $(document).on('click-row.bs.table', "#autocompleteTable", function ($element, row) {
            var data = el.excelTable("getData");
            data.splice(selectRow, 1, row);
            el.bootstrapTable("load", data);
        });
        //选择dropdown内容操作
        $(document).on("click", "#" + el[0].id + "[data-table=excelTable] .dropdown li", function () {
            $(this).parents("td").html($(this).children().html());
        });

        $(document).off("keyup").on('keyup', function (e) {
            //编辑状态
            if ($(e.target).hasClass("likeExcelText")) {
                var index = $(e.target).parent().index();
                var thisRowData = {};
                var coords = that.getCoords()[0][0];
                var data = el.excelTable("getData");
                var nextEle = $(e.target).parents("tr").next();
                var tds = $(e.target).parents("tr").children();
                var focusText;
                switch (e.which) {
                    //回车
                    case 13:
                        if (nextEle.length < 1) {
                            $.each(option.columns, function (i, v) {
                                thisRowData[v.field] = "";
                            });
                            data.push(thisRowData);
                            el.bootstrapTable("load", data);
                            that.fn_hideDropDownModal();
                            var tr = el.find("tbody").children();
                            var td = $(tr[tr.length - 1]).children()[index];
                            var ExcelText = that.getfocusInput();
                            $(td).addClass("tdselect").html(ExcelText);
                            $(td).children("input").trigger("focus");
                        }
                        else {
                            $.each(nextEle.children(), function (i, v) {
                                if (i == coords.y) {
                                    var focusText = $(v).html();
                                    focusText.indexOf('likeExcelText') != -1 ? focusText = $(v).children('input').val() : focusText;
                                    var ExcelText = that.getfocusInput(focusText);
                                    $(v).addClass("tdselect");
                                    $(v).html(ExcelText);
                                    $(v).children("input").trigger('focus');
                                    $(v).children("input")[0].selectionStart = focusText.length;
                                }
                            })
                        }
                        break;

                    //控制上下左右操作///////////////////////////////////
                    case 37:
                        var nextTD = $(e.target).parent().prev();
                        var nextTDIndex = nextTD.index();
                        that.arrowKeys(e.target, tds, nextTD, nextTDIndex, 37);
                        break;
                    case 38:
                        if ($(e.target).parents("tr").index() == 0) {
                            return;
                        }
                        var nextTD = $(e.target).parents("tr").prev().children().eq(index);
                        var nextTDIndex = nextTD.index();
                        that.arrowKeys(e.target, tds, nextTD, nextTDIndex)
                        break;
                    case 39:
                        var nextTD = $(e.target).parent().next();
                        var nextTDIndex = nextTD.index();
                        that.arrowKeys(e.target, tds, nextTD, nextTDIndex, 39)
                        break;
                    case 40:
                        var nextTD = $(e.target).parents("tr").next().children().eq(index);
                        var nextTDIndex = nextTD.index();
                        that.arrowKeys(e.target, tds, nextTD, nextTDIndex)
                        break;
                    ////////////////////////////////////////////////////
                }

            }

            //表格粘贴内容
            else {
                var tdselect = el.find(".tdselect");
                if (tdselect.length < 1) {
                    return;
                }
                if (e.ctrlKey && e.keyCode == 86) {
                    var textArea = document.getElementById("textArea");
                    $(textArea).focus();
                    $(textArea).select();
                    // 等50毫秒，keyPress事件发生了再去处理数据
                    setTimeout(that.dealwithData(that), 50);
                }
            }
        });
        $(document).on("keydown", function (e) {
            if ($(e.target).hasClass("likeExcelText")) {
                if (e.which == 9) { //按下tab键操作
                    e.preventDefault();  //去除默认选择
                    var tds = $(e.target).parents("tr").children();
                    var nextTD = $(e.target).parent().next();
                    var nextTDIndex = nextTD.index();
                    that.arrowKeys(e.target, tds, nextTD, nextTDIndex, 39);
                }
            }

        });

        //框选内容操作
        $(document).on("mousedown", "#" + el[0].id + "[data-table=excelTable]>tbody>tr>td", function (e) {
            selectRow = $(this).parent().data("index");
            if ($(e.target).hasClass("likeExcelText")) {
                return;
            }

            isMouseDown = true;
            startTime = Date.parse(new Date());
            clientX = e.clientX;
            clientY = e.clientY;

            el.find('.tdselect').removeClass("tdselect");
        });
        $(document).on("mousemove", "#" + el[0].id + "[data-table=excelTable]>tbody>tr>td", function (e) {
            console.log(isMouseDown)
            if ($(e.target).hasClass("likeExcelText") || $(this).hasClass("disabled")) {
                return;
            }
            var TD = this;
            var tr = $(TD).parents("tbody").children();
            var textArea = document.getElementById("textArea");
            var overtd = $(this);  //鼠标悬浮的元素
            var overtdX = $(this).parent().data("index");  //鼠标悬浮的表格X坐标
            var overtdY = $(this).index();                  //鼠标悬浮的表格Y坐标


            //设置鼠标移动方向
            if (e.clientY - clientY > 0) {
                mouseMoveY = "down";
            } else {
                mouseMoveY = "up";
            }
            if (e.clientX - clientX > 0) {
                mouseMoveX = "right";
            } else {
                mouseMoveX = "left";
            }
            ;
            ////////////////////////////////////////
            if (isMouseDown) {
                if (!$(this).hasClass("tdselect") && !$(this).hasClass("disabled")) {
                    $(this).addClass("tdselect");
                }
                $(this).addClass("tdselect");
                var coords = that.getCoords();           //获取已选坐标组
                if (coords.length > 1) {
                    el.find('.tdselect').removeClass("open");
                }
                var coordsFirstX = coords[0][0].x;   //第一个表格选择框的X坐标
                var coordsFirstY = coords[0][0].y;   //第一个表格选择框的Y坐标
                var coordsThisX = coords[coords.length - 1][coords[coords.length - 1].length - 1].x;  //最后一个表格选择框的X坐标
                var coordsThisY = coords[coords.length - 1][coords[coords.length - 1].length - 1].y;  //最后一个表格选择框的Y坐标

                if (mouseMoveY == "down" && mouseMoveX == "left" || mouseMoveY == "up" && mouseMoveX == "right") {
                    coordsFirstY = coords[coords.length - 1][0].y;
                    coordsThisY = coords[0][coords[0].length - 1].y;
                }

                coords = that.selectArea(coordsFirstX, coordsFirstY, coordsThisX, coordsThisY);

                that.selectTDStyle(coords);
                $(textArea).focus();                //为粘贴做准备

                //判断鼠标移动方向删减选择行和列
                if (!preSelectRow || preSelectRow != overtdX) {
                    if ($(this).hasClass("tdselect") && mouseMoveY == "down") {
                        $.each($(this).parents("tbody").children(), function (i, v) {
                            if (i > overtdX) {
                                $.each($(v).children(), function (idx, val) {
                                    $(val).removeClass("tdselect");
                                })
                            }
                        });
                    }
                    if ($(this).hasClass("tdselect") && mouseMoveY == "up") {
                        $.each($(this).parent().prev().children(), function (i, v) {
                            $(v).removeClass("tdselect");
                        });
                    }
                    preSelectRow = overtdX;
                }
                if (!preSelectCol || preSelectCol != overtdY) {
                    if ($(this).hasClass("tdselect") && mouseMoveX == "right") {
                        $.each(tr, function (i, v) {
                            $.each($(v).find(".tdselect"), function (idx, val) {
                                if ($(v).find(".tdselect").length > 1) {
                                    if (idx == $(v).find(".tdselect").length - 1) {
                                        $(val).removeClass("tdselect");
                                    }
                                }
                            });
                        });
                    }
                    if (overtd.prev().hasClass("tdselect") && mouseMoveX == "left") {
                        $.each(tr, function (i, v) {
                            $.each($(v).find(".tdselect"), function (idx, val) {
                                if (idx == 0) {
                                    $(val).removeClass("tdselect");
                                }
                            });
                        });
                    }
                    preSelectCol = overtdY;
                }
                ;
                ////////////////////////////////////////////
            } else {
                isMouseDown = false
            }

        });
        $(document).on("mouseup", "#" + el[0].id + "[data-table=excelTable]>tbody>tr>td", function (e) {
            isMouseDown = false;
            if ($(e.target).hasClass("likeExcelText")) {
                return;
            }
            that.getCoords(!endTime - startTime <= 300);
        });
        //删除按钮
        $(document).on("click", "#" + el[0].id + "[data-table=excelTable] .btn-delete", function () {
            $(this).parents('tr').remove();
        })
    };

    //控制上下左右方向键
    excelTable.prototype.arrowKeys = function (ele, tds, nextEle, nextEleIndex, key) {
        var el = this.el;
        var that = this;
        if (nextEle.length === 0) {
            return;
        }
        var index = $(ele).parent().index();
        var nextIndex;
        key == 37 ? nextIndex = index - 1 : key == 39 ? nextIndex = index + 1 : "";
        if (nextEle.hasClass("disabled")) {
            for (var i = 0; i < tds.length; i++) {
                if (i > index - 1 && i < tds.length - 1) {
                    if (!$(tds[i]).hasClass("disabled")) {
                        key == 37 ? nextEle = $(tds[i - 2]) : key == 39 ? nextEle = $(tds[i + 2]) : "";
                        break;
                    }
                } else if (nextEleIndex == tds.length - 1) {
                    return;
                }
            }
        }
        var focusText = nextEle.html();
        var tdWidth = $(nextEle).width()+2;
        var ExcelText = that.getfocusInput(focusText, tdWidth);
        nextEle.addClass("tdselect").html(ExcelText);
        nextEle.children(".likeExcelText").trigger("focus");
        nextEle.children(".likeExcelText")[0].selectionStart = focusText.length;
        $(ele).parent().removeClass("tdselect");
        $(ele).parent().html($(ele).val());
    };

    //设置编辑文本框
    excelTable.prototype.getfocusInput = function (focusText, width) {
        var ExcelText = '<input type="text" class="likeExcelText" id="likeExcelText" value="' + (focusText || "") + '" style="width: ' + (width - 2) + 'px;height: 100%;border: none;background-color: rgba(0,0,0,0);outline: unset;"/>'
        return ExcelText;
    };

    //算出框选的区域
    excelTable.prototype.selectArea = function (coordsFirstX, coordsFirstY, coordsThisX, coordsThisY) {
        var arr = [];
        for (var index = coordsFirstX; index < coordsThisX + 1; index++) {
            arr.push([]);
            for (var i = coordsFirstY; i < coordsThisY + 1; i++) {
                if (coordsFirstX != coordsThisX) {
                    arr[index - coordsFirstX].push({
                        x: index,
                        y: i
                    })

                } else {
                    arr[coordsThisX - index].push({
                        x: index,
                        y: i
                    })
                }
            }
        }
        return arr;
    };

    //获取坐标组
    excelTable.prototype.getCoords = function (Condition) {
        var tdselect = this.el.find(".tdselect");
        endTime = Date.parse(new Date());
        if (Condition || true) {
            var coords = []; //坐标组
            var Xcoords = [];
            var last = [];
            $.each(tdselect, function (i, v) {
                var thisCoords = {};
                thisCoords.x = $(v).parent().data("index");
                thisCoords.y = $(v).index();
                last.push(thisCoords);
            });
            $.each(last, function (i, v) {
                if (i == 0) {
                    Xcoords.push(v);
                    coords.push(Xcoords);
                } else if (last[i].x == last[i - 1].x) {
                    Xcoords.push(v);
                } else {
                    Xcoords = [];
                    Xcoords.push(v);
                    coords.push(Xcoords)
                }
            });
            return coords;
        }
    };

    ///先把要粘贴的数据放入控件中
    excelTable.prototype.dealwithData = function (that) {
        var el = that.el;
        var textArea = document.getElementById("textArea");
        var value = textArea.value; //获取粘贴内容
        var coords = that.getCoords();
        //内容格式化
        value = value.replace(/\t/g, "$");
        value = value.replace(/\n/g, "#");
        value = value.split("#");
        $.each(value, function (i, v) {
            value[i] = v.split("$");
        });
        value.splice(-1, 1);         //清除多余行
        /////////////////////////////

        $.each(value, function (idx, val) {
            if (idx > coords.length - 1) {
                coords.push([]); //复制内容行数多于要赋值坐标组时
            }
            $.each(coords, function (i, v) {
                $.each(val, function (c_i, c_v) {
                    if (v.length == 0) {  //为新建的空坐标组添加坐标内容
                        var data = el.excelTable("getData");
                        v.push({
                            x: coords[i - 1][0].x + 1,
                            y: coords[i - 1][0].y + c_i
                        })
                        if (coords[i][0].x > data.length - 1) {
                            data.push(that.BlankRow());
                            el.bootstrapTable("load", data);
                        }
                    } else if (c_i > v.length - 1) { //为多出列添加坐标内容
                        v.push({
                            x: v[0].x,
                            y: v[v.length - 1].y + 1
                        });
                    }
                });

                if (i == idx) { //赋值
                    $.each(v, function (v_idx, v_val) {
                        var td = el.find("tbody").children().eq(v[idx].x).children().eq(v_val.y);
                        if (td.hasClass("disabled")) {
                            return;
                        }
                        td.html(val[v_idx]);  //表格赋值
                    })
                }
            })
        });

        that.selectTDStyle(coords);
    };

    //给格子加样式
    excelTable.prototype.selectTDStyle = function (coords) {
        var el = this.el;
        $.each(coords, function (i, v) {
            $.each(v, function (idx, val) {
                el.find("tbody").children().eq(val.x).children().eq(val.y).addClass("tdselect");
            })
        })
    };

    //合并两个数组并去重
    excelTable.prototype.uniq = function (array) {
        var temp = []; //一个新的临时数组
        for (var i = 0; i < array.length; i++) {
            if (temp.indexOf(array[i]) == -1) {
                temp.push(array[i]);
            }
        }
        return temp;
    };

    //清除框选的区域
    excelTable.prototype.fn_hideDropDownModal = function () {
        this.el.find('.tdselect').removeClass("tdselect");
        this.el.find('.dropdown .dropdown-menu').remove();
        var tdStr = $("table").find('.likeExcelText');
        $.each(tdStr, function (i, v) {
            $(v).parent().html($(v).val());
        });
    };

    //设置autocomplete表格内容
    excelTable.prototype.setResult = function (data) {
        $("#autocompleteTable").bootstrapTable("load", data);
    };

    //设置dropdown内容
    excelTable.prototype.setDropdownResult = function (data, that) {
        var lis = "";
        $.each(data, function (i, v) {
            lis += ('<li><a href="#">' + v + '</a></li>');
        });
        that.el.find(".dropdown-menu").html(lis);
    };

    //判断浏览器类型
    excelTable.prototype.thisBrowser = function () {
        var userAgent = navigator.userAgent; //取得浏览器的userAgent字符串
        var isOpera = userAgent.indexOf("Opera") > -1;
        if (isOpera) {
            return "Opera"
        }
        ; //判断是否Opera浏览器
        if (userAgent.indexOf("Firefox") > -1) {
            return "FF";
        } //判断是否Firefox浏览器
        if (userAgent.indexOf("Chrome") > -1) {
            return "Chrome";
        }
        if (userAgent.indexOf("Safari") > -1) {
            return "Safari";
        } //判断是否Safari浏览器
        if (userAgent.indexOf("Trident") > -1 || (userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1 && !isOpera)) {
            return "IE";
        }
        ; //判断是否IE浏览器
    }

})($);
