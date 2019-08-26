/**
 * 列表页通用js
 *
 * @author svenouyang
 * @date 20171226
 *
 *  option
 *      areaRemindId:可选，专区开售提醒id
 *      areaList : 必传 专区列表
 *         areaId: 专区id
 *      areaConfigData: 必传 专区配置文件
 */
define('/mb/v4/js/page/fundlist/module/list', function(require, exports, module) {
    var varStorage = {},
        pageBox = null,
        callback = null,
        fundMod = require('./fundMod');
    //初始化
    exports.init = function(option) {
        varStorage = {};
        pageBox = option.box || $('body');

        option = option || {};
        varStorage.areaRemindId = option.areaRemindId;
        varStorage.areaList = option.areaList || [];
        varStorage.areaConfigData = option.areaConfigData || {};
        varStorage.cache = option.cache || false;
        varStorage.product_type = option.product_type || 'all';
        varStorage.allFunds =  option.allFunds || {};
        //这里的render要注意，有可能会重复调用刷新页面用
        varStorage.render = option.render;
        varStorage.fund_type = option.fund_type;
        varStorage.hideSoldOutFundType = option.hideSoldOutFundType;
        varStorage.checkFundState = !!option.checkFundState; //是否检查基金实时状态
        callback = option.cb;

        //3.测速
        G_SPEED.push((new Date()).getTime());
        //获取所有基金
        $.when(queryFundList()).then(function(data){
            queryFundListResult(data);
            //渲染
            render();

            //开售提醒蒙层
            if($.Env.ISWEIXIN){
                showHighLight();
                //初始化开售提醒
                window.getWidgetAsync('widget/onsaleRemind', require, function(onsaleRemind) {
                    onsaleRemind && onsaleRemind.init(pageBox,varStorage.remindFundList);
                });
            }
            //回调
            callback && callback(varStorage);
        });
        bindEvents();
    };

    /*基金处理*/
    function queryFundList() {
        var df = $.Deferred();
        fundMod.init({
            allFunds: varStorage.allFunds,
            cache: varStorage.cache,
            fund_type: varStorage.fund_type,
            product_type: varStorage.product_type,
            areaList: varStorage.areaList,
            areaConfigData: varStorage.areaConfigData,
            checkFundState: varStorage.checkFundState,//是否检查基金实时状态
            cb: function(data) {
                df.resolve(data);
            }
        });
        return df;
    };

    /*基金处理回调*/
    function queryFundListResult(data) {
        //4.请求完毕
        G_SPEED.push((new Date()).getTime());

        var fundList = data.fundList || [];
        varStorage.remindFundList = [];  //需要开售提醒列表
        varStorage.hideFundList = [];    //售罄隐藏列表
        varStorage.is_enterprise_loan = data.is_enterprise_loan; //判断当前用户是否持有企业贷
        varStorage.is_bank_white_user = data.is_bank_white_user  //判断是否银行理财白名单
        //初始顶部专区的订阅
        if(varStorage.areaRemindId){
            varStorage.remindFundList.push({
                fund_code : varStorage.areaRemindId,
                msgId : varStorage.areaRemindId,
                beforSetBtn:'<em class="css-add"></em>订阅',
                afterSetBtn:"已订阅",
                setClass:"disabled",
                unsetClass:"kee",
                successText:'<p class="tc">关注理财通公众号，专区有新品或高收益产品时，你将会收到提醒</p>',
                cancelText:'<p class="tc">取消后，你将不再收到该类产品的提醒</p>'
            });
        }

        var salingProductFunds = [];//正在售的，需要再次check在售状态
        fundList.map(function(t){
            var config = fundMod.getConfig(t);
            if(!config) return;

            fund = fundMod.initFund(t, config); //里面会结合静态配置重新初始

            if(!fund) return ;

            //售罄隐藏列表
            if(fund.buyState != '1' && config.displayRule == '1'){
                varStorage.hideFundList.push(fund);
                return;
            }

            //标志有余额+
            if(fund.info.is_overplus){
                varStorage.is_overplus = 1;
            }

            fund.isBottom = 0;

            //分专区子模块渲染
            for(var i = 0,len = varStorage.areaList.length;i<len;i++){
                var areaId = varStorage.areaList[i];
                //专区置底
                if(((config.areaPerformance || {})[areaId] || {}).isBottom == 1){
                    fund.isBottom = 1;
                }
                //专区忽略预约状态，当作可售处理
                if(((config.areaPerformance || {})[areaId] || {}).isIgnoreReserve == 1 && fund.info.reserve_flag == 1){
                    fund.buyState = '1';
                    if(fund.markTags.length>0 && fund.markTags[0].text =='支持智能买入') fund.markTags.shift();
                }

                varStorage[areaId] || (varStorage[areaId] = []);
                if(config.productTagIds.indexOf(areaId) >-1){
                    varStorage[areaId].push(fund);
                    //需要再次chekc在售状态的
                    //有product_code 且在售的，则去后台再次确认，因为静态文件有延时
                    if(fund.buyState == '1' && fund.info.product_code) {
                        salingProductFunds.push(fund);
                    }
                }
            }
            //需要设置开售提醒列表
            if(fund.buyState != '1' && fund.info.reserve_flag != '1' && fund.remindConfig.isON == '1'){
                varStorage.remindFundList.push({
                    fund_code : fund.info.fund_code,
                    msgId : fund.remindConfig.id,
                    beforeSaleHasSetText : fund.remindConfig.beforeSaleHasSetText,
                    relatedId:fund.remindConfig.relatedId,
                    afterSaleHasSetText : fund.remindConfig.afterSaleHasSetText,
                    beforeSaleNoSetText : fund.remindConfig.beforeSaleNoSetText,
                    afterSaleNoSetText : fund.remindConfig.afterSaleNoSetText,
                    unsetClass:"btn-chief-mini",
                    setClass:"btn-chief-hollow"
                });
            }
        });

        //如果有在售的需要check状态的
        if(varStorage.checkFundState && salingProductFunds.length) {
            $.when(fundMod.queryFundState(salingProductFunds, 0)).then(function(changedFunds){
                //如果有后台状态不一致的，则重刷页面
                if(changedFunds && changedFunds.length) {
                    changedFunds.map(function(f){
                        fundMod.initFund(f);
                    });
                    render();
                }
            });
        }
    }

    //渲染
    function render(){
        if(varStorage.render) {
            varStorage.render(varStorage);
            return;
        }
        for(var i = 0,len = varStorage.areaList.length;i<len;i++){
            var areaId = varStorage.areaList[i];
            var list = varStorage[areaId] || [];
            if(list.length > 0){
                list.sort(fundSort);
                var cssClass = (varStorage.areaConfigData[areaId] ||{}).class || 'js-fund-list';
                pageBox.find('.' + cssClass).html(pageBox.find("#fund_list_tpl").template({list: varStorage.hideSoldOutFundType ? hideSoldOut(list,varStorage.hideSoldOutFundType) : list ,maxLength:9999})).parent().removeClass('hide');
            }
        }
    }

    //隐藏已售罄非预约的产品，点击展示更多再展开
    function hideSoldOut(list,fundType){
        if (fundType) {
            list.forEach(function(item,index){
                if(item.buyState != '1' && item.info.reserve_flag == '0' && item.info.fund_type == fundType ){ //已售罄非预约的产品
                    item.soldOutHide = true;
                    //显示查看更多
                    pageBox.find('.js-view-more-funds').removeClass('hide');
                }
            });
        }
        return list;
    }

    //基金排序
    function fundSort(a, b) {
        //专区置底
        if(a.isBottom != b.isBottom){
            return a.isBottom == '1' ? 1 : -1;
        }
        //buyState有三个状态，0，1，2  可售在前
        if((a.buyState == '1' || b.buyState == '1') && a.buyState != b.buyState) {
            return a.buyState == '1' ? -1 : 1;
        }
        //当不可售时，预约在前
        if(a.buyState != '1' && b.buyState != '1'
            && (a.info.reserve_flag == '1' || b.info.reserve_flag == '1')
            && a.info.reserve_flag != b.info.reserve_flag){ //预约在前
            return a.info.reserve_flag == '1' ? -1:1;
        }
        //收益率在前
        if(a.rate != b.rate){
            return Number(a.rate) - Number(b.rate) > 0 ? -1 : 1;
        }
        //封闭期短的在前
        if(a.duration != b.duration){
            return Number(a.duration) - Number(b.duration);
        }
    }

    //蒙层出现逻辑，只出现一次
    function showHighLight() {
        var time = $.localStorage.getItem('showHighLight');
        if (!time) {
            $('.js-box').addClass('highlight-triggle'); //蒙层出现
            $.localStorage.setItem('showHighLight', window.SERVER_TIME);
        }
    }

    //绑定事件
    function bindEvents() {
        pageBox.find('.js-close-highlight').on($.Env.TAP, function(e) {
            $('.js-box').removeClass('highlight-triggle');
        });

        //查看更多
        pageBox.find('.js-view-more-funds').on($.Env.TAP, function() {
            pageBox.find('.js-fund-item.hide').removeClass('hide');
            $(this).addClass('hide');
        });
    }
    exports.fundSort = fundSort;
});
/**
 * 列表页通用js
 *
 * @author svenouyang
 * @date 20171226
 *
 *  option
 *      areaRemindId:可选，专区开售提醒id
 *      areaList : 必传 专区列表
 *         areaId: 专区id
 *      areaConfigData: 必传 专区配置文件
 */
define('/mb/v4/js/page/fundlist/module/list', function(require, exports, module) {
    var varStorage = {},
        pageBox = null,
        callback = null,
        fundMod = require('./fundMod');
    //初始化
    exports.init = function(option) {
        varStorage = {};
        pageBox = option.box || $('body');

        option = option || {};
        varStorage.areaRemindId = option.areaRemindId;
        varStorage.areaList = option.areaList || [];
        varStorage.areaConfigData = option.areaConfigData || {};
        varStorage.cache = option.cache || false;
        varStorage.product_type = option.product_type || 'all';
        varStorage.allFunds =  option.allFunds || {};
        //这里的render要注意，有可能会重复调用刷新页面用
        varStorage.render = option.render;
        varStorage.fund_type = option.fund_type;
        varStorage.hideSoldOutFundType = option.hideSoldOutFundType;
        varStorage.checkFundState = !!option.checkFundState; //是否检查基金实时状态
        callback = option.cb;

        //3.测速
        G_SPEED.push((new Date()).getTime());
        //获取所有基金
        $.when(queryFundList()).then(function(data){
            queryFundListResult(data);
            //渲染
            render();

            //开售提醒蒙层
            if($.Env.ISWEIXIN){
                showHighLight();
                //初始化开售提醒
                window.getWidgetAsync('widget/onsaleRemind', require, function(onsaleRemind) {
                    onsaleRemind && onsaleRemind.init(pageBox,varStorage.remindFundList);
                });
            }
            //回调
            callback && callback(varStorage);
        });
        bindEvents();
    };

    /*基金处理*/
    function queryFundList() {
        var df = $.Deferred();
        fundMod.init({
            allFunds: varStorage.allFunds,
            cache: varStorage.cache,
            fund_type: varStorage.fund_type,
            product_type: varStorage.product_type,
            areaList: varStorage.areaList,
            areaConfigData: varStorage.areaConfigData,
            checkFundState: varStorage.checkFundState,//是否检查基金实时状态
            cb: function(data) {
                df.resolve(data);
            }
        });
        return df;
    };

    /*基金处理回调*/
    function queryFundListResult(data) {
        //4.请求完毕
        G_SPEED.push((new Date()).getTime());

        var fundList = data.fundList || [];
        varStorage.remindFundList = [];  //需要开售提醒列表
        varStorage.hideFundList = [];    //售罄隐藏列表
        varStorage.is_enterprise_loan = data.is_enterprise_loan; //判断当前用户是否持有企业贷
        varStorage.is_bank_white_user = data.is_bank_white_user  //判断是否银行理财白名单
        //初始顶部专区的订阅
        if(varStorage.areaRemindId){
            varStorage.remindFundList.push({
                fund_code : varStorage.areaRemindId,
                msgId : varStorage.areaRemindId,
                beforSetBtn:'<em class="css-add"></em>订阅',
                afterSetBtn:"已订阅",
                setClass:"disabled",
                unsetClass:"kee",
                successText:'<p class="tc">关注理财通公众号，专区有新品或高收益产品时，你将会收到提醒</p>',
                cancelText:'<p class="tc">取消后，你将不再收到该类产品的提醒</p>'
            });
        }

        var salingProductFunds = [];//正在售的，需要再次check在售状态
        fundList.map(function(t){
            var config = fundMod.getConfig(t);
            if(!config) return;

            fund = fundMod.initFund(t, config); //里面会结合静态配置重新初始

            if(!fund) return ;

            //售罄隐藏列表
            if(fund.buyState != '1' && config.displayRule == '1'){
                varStorage.hideFundList.push(fund);
                return;
            }

            //标志有余额+
            if(fund.info.is_overplus){
                varStorage.is_overplus = 1;
            }

            fund.isBottom = 0;

            //分专区子模块渲染
            for(var i = 0,len = varStorage.areaList.length;i<len;i++){
                var areaId = varStorage.areaList[i];
                //专区置底
                if(((config.areaPerformance || {})[areaId] || {}).isBottom == 1){
                    fund.isBottom = 1;
                }
                //专区忽略预约状态，当作可售处理
                if(((config.areaPerformance || {})[areaId] || {}).isIgnoreReserve == 1 && fund.info.reserve_flag == 1){
                    fund.buyState = '1';
                    if(fund.markTags.length>0 && fund.markTags[0].text =='支持智能买入') fund.markTags.shift();
                }

                varStorage[areaId] || (varStorage[areaId] = []);
                if(config.productTagIds.indexOf(areaId) >-1){
                    varStorage[areaId].push(fund);
                    //需要再次chekc在售状态的
                    //有product_code 且在售的，则去后台再次确认，因为静态文件有延时
                    if(fund.buyState == '1' && fund.info.product_code) {
                        salingProductFunds.push(fund);
                    }
                }
            }
            //需要设置开售提醒列表
            if(fund.buyState != '1' && fund.info.reserve_flag != '1' && fund.remindConfig.isON == '1'){
                varStorage.remindFundList.push({
                    fund_code : fund.info.fund_code,
                    msgId : fund.remindConfig.id,
                    beforeSaleHasSetText : fund.remindConfig.beforeSaleHasSetText,
                    relatedId:fund.remindConfig.relatedId,
                    afterSaleHasSetText : fund.remindConfig.afterSaleHasSetText,
                    beforeSaleNoSetText : fund.remindConfig.beforeSaleNoSetText,
                    afterSaleNoSetText : fund.remindConfig.afterSaleNoSetText,
                    unsetClass:"btn-chief-mini",
                    setClass:"btn-chief-hollow"
                });
            }
        });

        //如果有在售的需要check状态的
        if(varStorage.checkFundState && salingProductFunds.length) {
            $.when(fundMod.queryFundState(salingProductFunds, 0)).then(function(changedFunds){
                //如果有后台状态不一致的，则重刷页面
                if(changedFunds && changedFunds.length) {
                    changedFunds.map(function(f){
                        fundMod.initFund(f);
                    });
                    render();
                }
            });
        }
    }

    //渲染
    function render(){
        if(varStorage.render) {
            varStorage.render(varStorage);
            return;
        }
        for(var i = 0,len = varStorage.areaList.length;i<len;i++){
            var areaId = varStorage.areaList[i];
            var list = varStorage[areaId] || [];
            if(list.length > 0){
                list.sort(fundSort);
                var cssClass = (varStorage.areaConfigData[areaId] ||{}).class || 'js-fund-list';
                pageBox.find('.' + cssClass).html(pageBox.find("#fund_list_tpl").template({list: varStorage.hideSoldOutFundType ? hideSoldOut(list,varStorage.hideSoldOutFundType) : list ,maxLength:9999})).parent().removeClass('hide');
            }
        }
    }

    //隐藏已售罄非预约的产品，点击展示更多再展开
    function hideSoldOut(list,fundType){
        if (fundType) {
            list.forEach(function(item,index){
                if(item.buyState != '1' && item.info.reserve_flag == '0' && item.info.fund_type == fundType ){ //已售罄非预约的产品
                    item.soldOutHide = true;
                    //显示查看更多
                    pageBox.find('.js-view-more-funds').removeClass('hide');
                }
            });
        }
        return list;
    }

    //基金排序
    function fundSort(a, b) {
        //专区置底
        if(a.isBottom != b.isBottom){
            return a.isBottom == '1' ? 1 : -1;
        }
        //buyState有三个状态，0，1，2  可售在前
        if((a.buyState == '1' || b.buyState == '1') && a.buyState != b.buyState) {
            return a.buyState == '1' ? -1 : 1;
        }
        //当不可售时，预约在前
        if(a.buyState != '1' && b.buyState != '1'
            && (a.info.reserve_flag == '1' || b.info.reserve_flag == '1')
            && a.info.reserve_flag != b.info.reserve_flag){ //预约在前
            return a.info.reserve_flag == '1' ? -1:1;
        }
        //收益率在前
        if(a.rate != b.rate){
            return Number(a.rate) - Number(b.rate) > 0 ? -1 : 1;
        }
        //封闭期短的在前
        if(a.duration != b.duration){
            return Number(a.duration) - Number(b.duration);
        }
    }

    //蒙层出现逻辑，只出现一次
    function showHighLight() {
        var time = $.localStorage.getItem('showHighLight');
        if (!time) {
            $('.js-box').addClass('highlight-triggle'); //蒙层出现
            $.localStorage.setItem('showHighLight', window.SERVER_TIME);
        }
    }

    //绑定事件
    function bindEvents() {
        pageBox.find('.js-close-highlight').on($.Env.TAP, function(e) {
            $('.js-box').removeClass('highlight-triggle');
        });

        //查看更多
        pageBox.find('.js-view-more-funds').on($.Env.TAP, function() {
            pageBox.find('.js-fund-item.hide').removeClass('hide');
            $(this).addClass('hide');
        });
    }
    exports.fundSort = fundSort;
});
/**
 * 列表页通用js
 *
 * @author svenouyang
 * @date 20171226
 *
 *  option
 *      areaRemindId:可选，专区开售提醒id
 *      areaList : 必传 专区列表
 *         areaId: 专区id
 *      areaConfigData: 必传 专区配置文件
 */
define('/mb/v4/js/page/fundlist/module/list', function(require, exports, module) {
    var varStorage = {},
        pageBox = null,
        callback = null,
        fundMod = require('./fundMod');
    //初始化
    exports.init = function(option) {
        varStorage = {};
        pageBox = option.box || $('body');

        option = option || {};
        varStorage.areaRemindId = option.areaRemindId;
        varStorage.areaList = option.areaList || [];
        varStorage.areaConfigData = option.areaConfigData || {};
        varStorage.cache = option.cache || false;
        varStorage.product_type = option.product_type || 'all';
        varStorage.allFunds =  option.allFunds || {};
        //这里的render要注意，有可能会重复调用刷新页面用
        varStorage.render = option.render;
        varStorage.fund_type = option.fund_type;
        varStorage.hideSoldOutFundType = option.hideSoldOutFundType;
        varStorage.checkFundState = !!option.checkFundState; //是否检查基金实时状态
        callback = option.cb;

        //3.测速
        G_SPEED.push((new Date()).getTime());
        //获取所有基金
        $.when(queryFundList()).then(function(data){
            queryFundListResult(data);
            //渲染
            render();

            //开售提醒蒙层
            if($.Env.ISWEIXIN){
                showHighLight();
                //初始化开售提醒
                window.getWidgetAsync('widget/onsaleRemind', require, function(onsaleRemind) {
                    onsaleRemind && onsaleRemind.init(pageBox,varStorage.remindFundList);
                });
            }
            //回调
            callback && callback(varStorage);
        });
        bindEvents();
    };

    /*基金处理*/
    function queryFundList() {
        var df = $.Deferred();
        fundMod.init({
            allFunds: varStorage.allFunds,
            cache: varStorage.cache,
            fund_type: varStorage.fund_type,
            product_type: varStorage.product_type,
            areaList: varStorage.areaList,
            areaConfigData: varStorage.areaConfigData,
            checkFundState: varStorage.checkFundState,//是否检查基金实时状态
            cb: function(data) {
                df.resolve(data);
            }
        });
        return df;
    };

    /*基金处理回调*/
    function queryFundListResult(data) {
        //4.请求完毕
        G_SPEED.push((new Date()).getTime());

        var fundList = data.fundList || [];
        varStorage.remindFundList = [];  //需要开售提醒列表
        varStorage.hideFundList = [];    //售罄隐藏列表
        varStorage.is_enterprise_loan = data.is_enterprise_loan; //判断当前用户是否持有企业贷
        varStorage.is_bank_white_user = data.is_bank_white_user  //判断是否银行理财白名单
        //初始顶部专区的订阅
        if(varStorage.areaRemindId){
            varStorage.remindFundList.push({
                fund_code : varStorage.areaRemindId,
                msgId : varStorage.areaRemindId,
                beforSetBtn:'<em class="css-add"></em>订阅',
                afterSetBtn:"已订阅",
                setClass:"disabled",
                unsetClass:"kee",
                successText:'<p class="tc">关注理财通公众号，专区有新品或高收益产品时，你将会收到提醒</p>',
                cancelText:'<p class="tc">取消后，你将不再收到该类产品的提醒</p>'
            });
        }

        var salingProductFunds = [];//正在售的，需要再次check在售状态
        fundList.map(function(t){
            var config = fundMod.getConfig(t);
            if(!config) return;

            fund = fundMod.initFund(t, config); //里面会结合静态配置重新初始

            if(!fund) return ;

            //售罄隐藏列表
            if(fund.buyState != '1' && config.displayRule == '1'){
                varStorage.hideFundList.push(fund);
                return;
            }

            //标志有余额+
            if(fund.info.is_overplus){
                varStorage.is_overplus = 1;
            }

            fund.isBottom = 0;

            //分专区子模块渲染
            for(var i = 0,len = varStorage.areaList.length;i<len;i++){
                var areaId = varStorage.areaList[i];
                //专区置底
                if(((config.areaPerformance || {})[areaId] || {}).isBottom == 1){
                    fund.isBottom = 1;
                }
                //专区忽略预约状态，当作可售处理
                if(((config.areaPerformance || {})[areaId] || {}).isIgnoreReserve == 1 && fund.info.reserve_flag == 1){
                    fund.buyState = '1';
                    if(fund.markTags.length>0 && fund.markTags[0].text =='支持智能买入') fund.markTags.shift();
                }

                varStorage[areaId] || (varStorage[areaId] = []);
                if(config.productTagIds.indexOf(areaId) >-1){
                    varStorage[areaId].push(fund);
                    //需要再次chekc在售状态的
                    //有product_code 且在售的，则去后台再次确认，因为静态文件有延时
                    if(fund.buyState == '1' && fund.info.product_code) {
                        salingProductFunds.push(fund);
                    }
                }
            }
            //需要设置开售提醒列表
            if(fund.buyState != '1' && fund.info.reserve_flag != '1' && fund.remindConfig.isON == '1'){
                varStorage.remindFundList.push({
                    fund_code : fund.info.fund_code,
                    msgId : fund.remindConfig.id,
                    beforeSaleHasSetText : fund.remindConfig.beforeSaleHasSetText,
                    relatedId:fund.remindConfig.relatedId,
                    afterSaleHasSetText : fund.remindConfig.afterSaleHasSetText,
                    beforeSaleNoSetText : fund.remindConfig.beforeSaleNoSetText,
                    afterSaleNoSetText : fund.remindConfig.afterSaleNoSetText,
                    unsetClass:"btn-chief-mini",
                    setClass:"btn-chief-hollow"
                });
            }
        });

        //如果有在售的需要check状态的
        if(varStorage.checkFundState && salingProductFunds.length) {
            $.when(fundMod.queryFundState(salingProductFunds, 0)).then(function(changedFunds){
                //如果有后台状态不一致的，则重刷页面
                if(changedFunds && changedFunds.length) {
                    changedFunds.map(function(f){
                        fundMod.initFund(f);
                    });
                    render();
                }
            });
        }
    }

    //渲染
    function render(){
        if(varStorage.render) {
            varStorage.render(varStorage);
            return;
        }
        for(var i = 0,len = varStorage.areaList.length;i<len;i++){
            var areaId = varStorage.areaList[i];
            var list = varStorage[areaId] || [];
            if(list.length > 0){
                list.sort(fundSort);
                var cssClass = (varStorage.areaConfigData[areaId] ||{}).class || 'js-fund-list';
                pageBox.find('.' + cssClass).html(pageBox.find("#fund_list_tpl").template({list: varStorage.hideSoldOutFundType ? hideSoldOut(list,varStorage.hideSoldOutFundType) : list ,maxLength:9999})).parent().removeClass('hide');
            }
        }
    }

    //隐藏已售罄非预约的产品，点击展示更多再展开
    function hideSoldOut(list,fundType){
        if (fundType) {
            list.forEach(function(item,index){
                if(item.buyState != '1' && item.info.reserve_flag == '0' && item.info.fund_type == fundType ){ //已售罄非预约的产品
                    item.soldOutHide = true;
                    //显示查看更多
                    pageBox.find('.js-view-more-funds').removeClass('hide');
                }
            });
        }
        return list;
    }

    //基金排序
    function fundSort(a, b) {
        //专区置底
        if(a.isBottom != b.isBottom){
            return a.isBottom == '1' ? 1 : -1;
        }
        //buyState有三个状态，0，1，2  可售在前
        if((a.buyState == '1' || b.buyState == '1') && a.buyState != b.buyState) {
            return a.buyState == '1' ? -1 : 1;
        }
        //当不可售时，预约在前
        if(a.buyState != '1' && b.buyState != '1'
            && (a.info.reserve_flag == '1' || b.info.reserve_flag == '1')
            && a.info.reserve_flag != b.info.reserve_flag){ //预约在前
            return a.info.reserve_flag == '1' ? -1:1;
        }
        //收益率在前
        if(a.rate != b.rate){
            return Number(a.rate) - Number(b.rate) > 0 ? -1 : 1;
        }
        //封闭期短的在前
        if(a.duration != b.duration){
            return Number(a.duration) - Number(b.duration);
        }
    }

    //蒙层出现逻辑，只出现一次
    function showHighLight() {
        var time = $.localStorage.getItem('showHighLight');
        if (!time) {
            $('.js-box').addClass('highlight-triggle'); //蒙层出现
            $.localStorage.setItem('showHighLight', window.SERVER_TIME);
        }
    }

    //绑定事件
    function bindEvents() {
        pageBox.find('.js-close-highlight').on($.Env.TAP, function(e) {
            $('.js-box').removeClass('highlight-triggle');
        });

        //查看更多
        pageBox.find('.js-view-more-funds').on($.Env.TAP, function() {
            pageBox.find('.js-fund-item.hide').removeClass('hide');
            $(this).addClass('hide');
        });
    }
    exports.fundSort = fundSort;
});
/**
 * 列表页通用js
 *
 * @author svenouyang
 * @date 20171226
 *
 *  option
 *      areaRemindId:可选，专区开售提醒id
 *      areaList : 必传 专区列表
 *         areaId: 专区id
 *      areaConfigData: 必传 专区配置文件
 */
define('/mb/v4/js/page/fundlist/module/list', function(require, exports, module) {
    var varStorage = {},
        pageBox = null,
        callback = null,
        fundMod = require('./fundMod');
    //初始化
    exports.init = function(option) {
        varStorage = {};
        pageBox = option.box || $('body');

        option = option || {};
        varStorage.areaRemindId = option.areaRemindId;
        varStorage.areaList = option.areaList || [];
        varStorage.areaConfigData = option.areaConfigData || {};
        varStorage.cache = option.cache || false;
        varStorage.product_type = option.product_type || 'all';
        varStorage.allFunds =  option.allFunds || {};
        //这里的render要注意，有可能会重复调用刷新页面用
        varStorage.render = option.render;
        varStorage.fund_type = option.fund_type;
        varStorage.hideSoldOutFundType = option.hideSoldOutFundType;
        varStorage.checkFundState = !!option.checkFundState; //是否检查基金实时状态
        callback = option.cb;

        //3.测速
        G_SPEED.push((new Date()).getTime());
        //获取所有基金
        $.when(queryFundList()).then(function(data){
            queryFundListResult(data);
            //渲染
            render();

            //开售提醒蒙层
            if($.Env.ISWEIXIN){
                showHighLight();
                //初始化开售提醒
                window.getWidgetAsync('widget/onsaleRemind', require, function(onsaleRemind) {
                    onsaleRemind && onsaleRemind.init(pageBox,varStorage.remindFundList);
                });
            }
            //回调
            callback && callback(varStorage);
        });
        bindEvents();
    };

    /*基金处理*/
    function queryFundList() {
        var df = $.Deferred();
        fundMod.init({
            allFunds: varStorage.allFunds,
            cache: varStorage.cache,
            fund_type: varStorage.fund_type,
            product_type: varStorage.product_type,
            areaList: varStorage.areaList,
            areaConfigData: varStorage.areaConfigData,
            checkFundState: varStorage.checkFundState,//是否检查基金实时状态
            cb: function(data) {
                df.resolve(data);
            }
        });
        return df;
    };

    /*基金处理回调*/
    function queryFundListResult(data) {
        //4.请求完毕
        G_SPEED.push((new Date()).getTime());

        var fundList = data.fundList || [];
        varStorage.remindFundList = [];  //需要开售提醒列表
        varStorage.hideFundList = [];    //售罄隐藏列表
        varStorage.is_enterprise_loan = data.is_enterprise_loan; //判断当前用户是否持有企业贷
        varStorage.is_bank_white_user = data.is_bank_white_user  //判断是否银行理财白名单
        //初始顶部专区的订阅
        if(varStorage.areaRemindId){
            varStorage.remindFundList.push({
                fund_code : varStorage.areaRemindId,
                msgId : varStorage.areaRemindId,
                beforSetBtn:'<em class="css-add"></em>订阅',
                afterSetBtn:"已订阅",
                setClass:"disabled",
                unsetClass:"kee",
                successText:'<p class="tc">关注理财通公众号，专区有新品或高收益产品时，你将会收到提醒</p>',
                cancelText:'<p class="tc">取消后，你将不再收到该类产品的提醒</p>'
            });
        }

        var salingProductFunds = [];//正在售的，需要再次check在售状态
        fundList.map(function(t){
            var config = fundMod.getConfig(t);
            if(!config) return;

            fund = fundMod.initFund(t, config); //里面会结合静态配置重新初始

            if(!fund) return ;

            //售罄隐藏列表
            if(fund.buyState != '1' && config.displayRule == '1'){
                varStorage.hideFundList.push(fund);
                return;
            }

            //标志有余额+
            if(fund.info.is_overplus){
                varStorage.is_overplus = 1;
            }

            fund.isBottom = 0;

            //分专区子模块渲染
            for(var i = 0,len = varStorage.areaList.length;i<len;i++){
                var areaId = varStorage.areaList[i];
                //专区置底
                if(((config.areaPerformance || {})[areaId] || {}).isBottom == 1){
                    fund.isBottom = 1;
                }
                //专区忽略预约状态，当作可售处理
                if(((config.areaPerformance || {})[areaId] || {}).isIgnoreReserve == 1 && fund.info.reserve_flag == 1){
                    fund.buyState = '1';
                    if(fund.markTags.length>0 && fund.markTags[0].text =='支持智能买入') fund.markTags.shift();
                }

                varStorage[areaId] || (varStorage[areaId] = []);
                if(config.productTagIds.indexOf(areaId) >-1){
                    varStorage[areaId].push(fund);
                    //需要再次chekc在售状态的
                    //有product_code 且在售的，则去后台再次确认，因为静态文件有延时
                    if(fund.buyState == '1' && fund.info.product_code) {
                        salingProductFunds.push(fund);
                    }
                }
            }
            //需要设置开售提醒列表
            if(fund.buyState != '1' && fund.info.reserve_flag != '1' && fund.remindConfig.isON == '1'){
                varStorage.remindFundList.push({
                    fund_code : fund.info.fund_code,
                    msgId : fund.remindConfig.id,
                    beforeSaleHasSetText : fund.remindConfig.beforeSaleHasSetText,
                    relatedId:fund.remindConfig.relatedId,
                    afterSaleHasSetText : fund.remindConfig.afterSaleHasSetText,
                    beforeSaleNoSetText : fund.remindConfig.beforeSaleNoSetText,
                    afterSaleNoSetText : fund.remindConfig.afterSaleNoSetText,
                    unsetClass:"btn-chief-mini",
                    setClass:"btn-chief-hollow"
                });
            }
        });

        //如果有在售的需要check状态的
        if(varStorage.checkFundState && salingProductFunds.length) {
            $.when(fundMod.queryFundState(salingProductFunds, 0)).then(function(changedFunds){
                //如果有后台状态不一致的，则重刷页面
                if(changedFunds && changedFunds.length) {
                    changedFunds.map(function(f){
                        fundMod.initFund(f);
                    });
                    render();
                }
            });
        }
    }

    //渲染
    function render(){
        if(varStorage.render) {
            varStorage.render(varStorage);
            return;
        }
        for(var i = 0,len = varStorage.areaList.length;i<len;i++){
            var areaId = varStorage.areaList[i];
            var list = varStorage[areaId] || [];
            if(list.length > 0){
                list.sort(fundSort);
                var cssClass = (varStorage.areaConfigData[areaId] ||{}).class || 'js-fund-list';
                pageBox.find('.' + cssClass).html(pageBox.find("#fund_list_tpl").template({list: varStorage.hideSoldOutFundType ? hideSoldOut(list,varStorage.hideSoldOutFundType) : list ,maxLength:9999})).parent().removeClass('hide');
            }
        }
    }

    //隐藏已售罄非预约的产品，点击展示更多再展开
    function hideSoldOut(list,fundType){
        if (fundType) {
            list.forEach(function(item,index){
                if(item.buyState != '1' && item.info.reserve_flag == '0' && item.info.fund_type == fundType ){ //已售罄非预约的产品
                    item.soldOutHide = true;
                    //显示查看更多
                    pageBox.find('.js-view-more-funds').removeClass('hide');
                }
            });
        }
        return list;
    }

    //基金排序
    function fundSort(a, b) {
        //专区置底
        if(a.isBottom != b.isBottom){
            return a.isBottom == '1' ? 1 : -1;
        }
        //buyState有三个状态，0，1，2  可售在前
        if((a.buyState == '1' || b.buyState == '1') && a.buyState != b.buyState) {
            return a.buyState == '1' ? -1 : 1;
        }
        //当不可售时，预约在前
        if(a.buyState != '1' && b.buyState != '1'
            && (a.info.reserve_flag == '1' || b.info.reserve_flag == '1')
            && a.info.reserve_flag != b.info.reserve_flag){ //预约在前
            return a.info.reserve_flag == '1' ? -1:1;
        }
        //收益率在前
        if(a.rate != b.rate){
            return Number(a.rate) - Number(b.rate) > 0 ? -1 : 1;
        }
        //封闭期短的在前
        if(a.duration != b.duration){
            return Number(a.duration) - Number(b.duration);
        }
    }

    //蒙层出现逻辑，只出现一次
    function showHighLight() {
        var time = $.localStorage.getItem('showHighLight');
        if (!time) {
            $('.js-box').addClass('highlight-triggle'); //蒙层出现
            $.localStorage.setItem('showHighLight', window.SERVER_TIME);
        }
    }

    //绑定事件
    function bindEvents() {
        pageBox.find('.js-close-highlight').on($.Env.TAP, function(e) {
            $('.js-box').removeClass('highlight-triggle');
        });

        //查看更多
        pageBox.find('.js-view-more-funds').on($.Env.TAP, function() {
            pageBox.find('.js-fund-item.hide').removeClass('hide');
            $(this).addClass('hide');
        });
    }
    exports.fundSort = fundSort;
});
/**
 * 列表页通用js
 *
 * @author svenouyang
 * @date 20171226
 *
 *  option
 *      areaRemindId:可选，专区开售提醒id
 *      areaList : 必传 专区列表
 *         areaId: 专区id
 *      areaConfigData: 必传 专区配置文件
 */
define('/mb/v4/js/page/fundlist/module/list', function(require, exports, module) {
    var varStorage = {},
        pageBox = null,
        callback = null,
        fundMod = require('./fundMod');
    //初始化
    exports.init = function(option) {
        varStorage = {};
        pageBox = option.box || $('body');

        option = option || {};
        varStorage.areaRemindId = option.areaRemindId;
        varStorage.areaList = option.areaList || [];
        varStorage.areaConfigData = option.areaConfigData || {};
        varStorage.cache = option.cache || false;
        varStorage.product_type = option.product_type || 'all';
        varStorage.allFunds =  option.allFunds || {};
        //这里的render要注意，有可能会重复调用刷新页面用
        varStorage.render = option.render;
        varStorage.fund_type = option.fund_type;
        varStorage.hideSoldOutFundType = option.hideSoldOutFundType;
        varStorage.checkFundState = !!option.checkFundState; //是否检查基金实时状态
        callback = option.cb;

        //3.测速
        G_SPEED.push((new Date()).getTime());
        //获取所有基金
        $.when(queryFundList()).then(function(data){
            queryFundListResult(data);
            //渲染
            render();

            //开售提醒蒙层
            if($.Env.ISWEIXIN){
                showHighLight();
                //初始化开售提醒
                window.getWidgetAsync('widget/onsaleRemind', require, function(onsaleRemind) {
                    onsaleRemind && onsaleRemind.init(pageBox,varStorage.remindFundList);
                });
            }
            //回调
            callback && callback(varStorage);
        });
        bindEvents();
    };

    /*基金处理*/
    function queryFundList() {
        var df = $.Deferred();
        fundMod.init({
            allFunds: varStorage.allFunds,
            cache: varStorage.cache,
            fund_type: varStorage.fund_type,
            product_type: varStorage.product_type,
            areaList: varStorage.areaList,
            areaConfigData: varStorage.areaConfigData,
            checkFundState: varStorage.checkFundState,//是否检查基金实时状态
            cb: function(data) {
                df.resolve(data);
            }
        });
        return df;
    };

    /*基金处理回调*/
    function queryFundListResult(data) {
        //4.请求完毕
        G_SPEED.push((new Date()).getTime());

        var fundList = data.fundList || [];
        varStorage.remindFundList = [];  //需要开售提醒列表
        varStorage.hideFundList = [];    //售罄隐藏列表
        varStorage.is_enterprise_loan = data.is_enterprise_loan; //判断当前用户是否持有企业贷
        varStorage.is_bank_white_user = data.is_bank_white_user  //判断是否银行理财白名单
        //初始顶部专区的订阅
        if(varStorage.areaRemindId){
            varStorage.remindFundList.push({
                fund_code : varStorage.areaRemindId,
                msgId : varStorage.areaRemindId,
                beforSetBtn:'<em class="css-add"></em>订阅',
                afterSetBtn:"已订阅",
                setClass:"disabled",
                unsetClass:"kee",
                successText:'<p class="tc">关注理财通公众号，专区有新品或高收益产品时，你将会收到提醒</p>',
                cancelText:'<p class="tc">取消后，你将不再收到该类产品的提醒</p>'
            });
        }

        var salingProductFunds = [];//正在售的，需要再次check在售状态
        fundList.map(function(t){
            var config = fundMod.getConfig(t);
            if(!config) return;

            fund = fundMod.initFund(t, config); //里面会结合静态配置重新初始

            //标志有余额+
            if(fund.info.is_overplus){
                varStorage.is_overplus = 1;
            }

            //分专区子模块渲染
            for(var i = 0,len = varStorage.areaList.length;i<len;i++){
                var areaId = varStorage.areaList[i];
                //专区置底
                if(((config.areaPerformance || {})[areaId] || {}).isBottom == 1){
                    fund.isBottom = 1;
                }
                //专区忽略预约状态，当作可售处理
                if(((config.areaPerformance || {})[areaId] || {}).isIgnoreReserve == 1 && fund.info.reserve_flag == 1){
                    fund.buyState = '1';
                    if(fund.markTags.length>0 && fund.markTags[0].text =='支持智能买入') fund.markTags.shift();
                }

                varStorage[areaId] || (varStorage[areaId] = []);
                if(config.productTagIds.indexOf(areaId) >-1){
                    varStorage[areaId].push(fund);
                    //需要再次chekc在售状态的
                    //有product_code 且在售的，则去后台再次确认，因为静态文件有延时
                    if(fund.buyState == '1' && fund.info.product_code) {
                        salingProductFunds.push(fund);
                    }
                }
            }
            //需要设置开售提醒列表
            if(fund.buyState != '1' && fund.info.reserve_flag != '1' && fund.remindConfig.isON == '1'){
                varStorage.remindFundList.push({
                    fund_code : fund.info.fund_code,
                    msgId : fund.remindConfig.id,
                    beforeSaleHasSetText : fund.remindConfig.beforeSaleHasSetText,
                    relatedId:fund.remindConfig.relatedId,
                    afterSaleHasSetText : fund.remindConfig.afterSaleHasSetText,
                    beforeSaleNoSetText : fund.remindConfig.beforeSaleNoSetText,
                    afterSaleNoSetText : fund.remindConfig.afterSaleNoSetText,
                    unsetClass:"btn-chief-mini",
                    setClass:"btn-chief-hollow"
                });
            }
        });

        //如果有在售的需要check状态的
        if(varStorage.checkFundState && salingProductFunds.length) {
            $.when(fundMod.queryFundState(salingProductFunds, 0)).then(function(changedFunds){
                //如果有后台状态不一致的，则重刷页面
                if(changedFunds && changedFunds.length) {
                    changedFunds.map(function(f){
                        fundMod.initFund(f);
                    });
                    render();
                }
            });
        }
    }

    //渲染
    function render(){
        if(varStorage.render) {
            varStorage.render(varStorage);
            return;
        }
        for(var i = 0,len = varStorage.areaList.length;i<len;i++){
            var areaId = varStorage.areaList[i];
            var list = varStorage[areaId] || [];
            if(list.length > 0){
                list.sort(fundSort);
                var cssClass = (varStorage.areaConfigData[areaId] ||{}).class || 'js-fund-list';
                pageBox.find('.' + cssClass).html(pageBox.find("#fund_list_tpl").template({list: varStorage.hideSoldOutFundType ? hideSoldOut(list,varStorage.hideSoldOutFundType) : list ,maxLength:9999})).parent().removeClass('hide');
            }
        }
    }

    //隐藏已售罄非预约的产品，点击展示更多再展开
    function hideSoldOut(list,fundType){
        if (fundType) {
            list.forEach(function(item,index){
                if(item.buyState != '1' && item.info.reserve_flag == '0' && item.info.fund_type == fundType ){ //已售罄非预约的产品
                    item.soldOutHide = true;
                    //显示查看更多
                    pageBox.find('.js-view-more-funds').removeClass('hide');
                }
            });
        }
        return list;
    }

    //基金排序
    function fundSort(a, b) {
        //专区置底
        if(a.isBottom != b.isBottom){
            return a.isBottom == '1' ? 1 : -1;
        }
        //buyState有三个状态，0，1，2  可售在前
        if((a.buyState == '1' || b.buyState == '1') && a.buyState != b.buyState) {
            return a.buyState == '1' ? -1 : 1;
        }
        //当不可售时，预约在前
        if(a.buyState != '1' && b.buyState != '1'
            && (a.info.reserve_flag == '1' || b.info.reserve_flag == '1')
            && a.info.reserve_flag != b.info.reserve_flag){ //预约在前
            return a.info.reserve_flag == '1' ? -1:1;
        }
        //收益率在前
        if(a.rate != b.rate){
            return Number(a.rate) - Number(b.rate) > 0 ? -1 : 1;
        }
        //封闭期短的在前
        if(a.duration != b.duration){
            return Number(a.duration) - Number(b.duration);
        }
    }

    //蒙层出现逻辑，只出现一次
    function showHighLight() {
        var time = $.localStorage.getItem('showHighLight');
        if (!time) {
            $('.js-box').addClass('highlight-triggle'); //蒙层出现
            $.localStorage.setItem('showHighLight', window.SERVER_TIME);
        }
    }

    //绑定事件
    function bindEvents() {
        pageBox.find('.js-close-highlight').on($.Env.TAP, function(e) {
            $('.js-box').removeClass('highlight-triggle');
        });

        //查看更多
        pageBox.find('.js-view-more-funds').on($.Env.TAP, function() {
            pageBox.find('.js-fund-item.hide').removeClass('hide');
            $(this).addClass('hide');
        });
    }
});
