var DATA = {
    oldCN: '',
    companyName: '',
    companyAvatar:'',
    nickname: '',
    n: 0,
    avatar: '',
    phonenum: '',
    joinList: [],
    resultImg: '',
    resultStr: '',
    resultColor: ''
};

//var BaseUrl = 'http://api.meizhanggui.cc/V1.0.0/';
var _id = location.search.substr(1).match(/_id=([^\b&]*)/)[1];//获取机构id...之类的
var BaseUrl = 'http://123.57.42.13/V1.0.0/';

var putTemp = function (ele, data) {
    var html = $('#' + ele).html(),
        args = html.match(/\{\{[A-z]*}}/g),
        i = 0,
        param = '',
        ReplaceArray = [];
    for (i = 0; i < args.length; i++) {
        param = args[i].substr(2, args[i].length - 4);
        if (data[param]) {
            ReplaceArray.push({
                Reg: '{{' + param + '}}',
                value: data[param]
            })
        }
    }
    for (i = 0; i < ReplaceArray.length; i++) {
        html = html.replace(ReplaceArray[i].Reg, ReplaceArray[i].value);
    }
    $('#' + ele).html(html);
};

var myJsonp = function (obj,pageObj) {
    $.jsonp({
        url: obj.url,
        callbackParameter: obj.callbackParameter?obj.callbackParameter:"callback",
        data:obj.data?obj.data:null,
        success: obj.success,
        error: obj.error ? obj.error : function () {
            layer.msg('您的网络连接不太顺畅哦!');
        },
        beforeSend:pageObj?function(){
            pageObj.isClick = true;
                $('#loading').show();

        }:null,
        complete: pageObj?function () {
            $('#loading').hide();
            pageObj.isClick = false;
        }:null
    })
};

var nowPage = function (str) {
    putTemp(str, DATA);
    $('.page').hide();
    switch (str) {
        case 'entry':
            $('#entry .btn').click(page_entry.btn$click);
            break;
        case 'register':
            $('#register .btn').click(page_register.btn$click);
            $('#register .getVec').click(page_register.vec$click);
            break;
        case 'join':
            $('#join .btn').click(page_join.btn$click);
            $('#join .getVec').click(page_join.vec$click);
            break;
        case 'choose':
            $('#choose .btn').click(page_choose.btn$click);
            break;
    }
    $('#' + str).show();
};

var result = function (status, msg) {

    DATA.resultImg = status;
    DATA.resultStr = status=='success'?('您已成功加入' + DATA.companyName + '！'):msg;
    DATA.resultColor = status == 'fail' ? '#ff0000' : '#84c579';

    nowPage('finish');
};

window.addEventListener('load', function () {
    FastClick.attach(document.body);
}, false);

(function () {
    //获取基本信息
    myJsonp({
        url: BaseUrl + "Company/info?_method=GET",
        data:{
            conpanyId:_id,
            clerks:true
        },
        success: function (obj) {
            obj = $.parseJSON(obj);

            if (obj.code == 0) {

                if(obj.data.companyInfo.switch==0){
                    return result('fail','该店铺暂时不接受纹身师加入!');
                }
                DATA.companyAvatar = obj.data.companyInfo.logo?obj.data.companyInfo.logo + '?imageView2/0/w/160':'imgs/def_avatar.jpg';
                DATA.companyName = obj.data.companyInfo.name;
                DATA.n = obj.data.companyInfo?obj.data.companyInfo.clerkIdList:0;
                DATA.joinList = obj.data.userList;

                var $other = $('#entry .other');
                if (DATA.joinList.length > 0) {
                    for (var i = 0; i < DATA.joinList.length; i++) {
                        if(DATA.joinList[i].avatar == ''){
                            DATA.joinList[i].avatar = 'imgs/def_avatar.jpg';
                        }
                        else{
                            DATA.joinList[i].avatar += '?imageView2/0/w/160';
                        }
                        $other.append(
                            '<div class="row">'
                            + '<div class="subavatar"><img src="'+DATA.joinList[i].avatar+'"/></div>'
                            + '<div class="f32 c1a">'+DATA.joinList[i].nickname+'</div>'
                            + '</div>'
                        );
                    }
                }
                else {
                    $other.hide();
                }

                nowPage('entry');

            }
            else {
                result('fail', obj.msg);
            }

            $('#loading').hide();
        }
    });
})();

var page_entry = {
    isClick: false,
    btn$click: function () {
        if (this.isClick)return;
        var ph = $('#entry #phonenum').attr('value');
        if (ph.length != 11) {
            layer.msg('请输入正确的手机号');
            return;
        }
        else {
            DATA.phonenum = ph;
            myJsonp({
                url: BaseUrl + "User/h5Check?_method=GET",
                data: {
                    phonenum: ph
                },
                success: function (obj) {
                    obj = $.parseJSON(obj);

                    if (obj.code == 0) {

                        if(obj.data.userInfo){//已注册，验证身份
                            if(obj.data.userInfo.avatar == ''){
                                DATA.avatar = 'imgs/def_avatar.jpg';
                            }else{
                                DATA.avatar = obj.data.userInfo.avatar + '?imageView2/0/w/160';
                            }
                            DATA.nickname = obj.data.userInfo.nickname;
                            nowPage('join');
                        }
                        else{//尚未注册
                            nowPage('register');
                        }

                    } else {
                        layer.msg(obj.msg);
                    }

                }
            },page_entry);
        }
    }
};

var page_register = {
    isClick: false,
    vecTime: 0,
    btn$click: function () {
        if (this.isClick)return;
        var nickname = $('#register .nickname').attr('value');
        var captcha = $('#register .vec').attr('value');
        if (captcha.length < 6) {
            layer.msg('请输入完整的验证码！');
            return;
        }

        myJsonp({
            url: BaseUrl + "User/h5Register?_method=PUT",
            data: {
                phonenum: DATA.phonenum,
                nickname: nickname,
                captcha: captcha
            },
            success: function (obj) {
                obj = $.parseJSON(obj);

                if (obj.code == 0) {

                    layer.msg('注册成功!');
                    result('success');

                } else {
                    layer.msg(obj.msg);
                }
            }
        },page_register)

    },
    vec$click: function () {
        if (this.isClick || this.vecTime > 0)return;

        myJsonp({
            url: BaseUrl + "User/h5RegisterCaptcha?_method=GET",
            data: {
                phonenum: DATA.phonenum
            },
            success: function (obj) {
                obj = $.parseJSON(obj);

                if (obj.code == 0) {
                    layer.msg('验证码已发送');
                    page_register.vecTime = 60;
                    $('#register .getVec').text('剩余60秒');
                    $('#register .getVec').addClass('disable');
                    window.timer = setInterval(function () {
                        page_register.vecTime--;
                        if (page_register.vecTime == 0) {
                            clearInterval(timer);
                            $('#register .getVec').removeClass('disable');
                            $('#register .getVec').text('获取验证码');
                        }
                    }, 1000);

                } else {
                    layer.msg(obj.msg);
                }
            }
        },page_register);
    }
};

var page_join = {
    isClick:false,
    vecTime: 0,
    btn$click: function () {
        if (this.isClick)return;
        var captcha = $('#join .vec').attr('value');
        if (captcha.length < 6) {
            layer.msg('请输入完整的验证码！');
            return;
        }

        myJsonp({
            url: BaseUrl + "User/login?_method=POST",
            data: {
                phonenum: DATA.phonenum,
                captcha: captcha
            },
            success: function (obj) {
                obj = $.parseJSON(obj);

                if (obj.code == 0) {

                    if(parseInt(obj.data.ownUserInfo.sector)!=30){
                        //不是纹身师
                        result('fail', '只有纹身师可以加入店铺！');
                    }
                    else{
                        if(obj.data.ownUserInfo.companyId){
                            //有所属的纹身师
                            if(obj.data.ownUserInfo.companyId==_id){
                                result('fail','您已经在该机构中。');
                            }
                            else{
                                nowPage('choose');
                            }
                        }
                        else{
                            //无所属的纹身师
                            myJsonp({
                                url:BaseUrl + "Company/clerk?_method=PUT",
                                data:{
                                    companyId:_id
                                },
                                success:function(obj){
                                    obj = $.parseJSON(obj);

                                    if (obj.code == 0) {
                                        result('success');
                                    } else {
                                        layer.msg(obj.msg);
                                    }
                                }
                            });
                            result('success');
                        }
                    }


                } else {
                    layer.msg(obj.msg);
                }
            }
        },page_join)

    },
    vec$click: function () {
        if (this.isClick || this.vecTime > 0)return;

        myJsonp({
            url: BaseUrl + "User/h5RegisterCaptcha?_method=GET",
            data: {
                phonenum: DATA.phonenum
            },
            success: function (obj) {
                obj = $.parseJSON(obj);

                if (obj.code == 0) {
                    layer.msg('验证码已发送');
                    page_join.vecTime = 60;
                    $('#join .getVec').text('剩余60秒');
                    $('#join .getVec').addClass('disable');
                    window.timer = setInterval(function () {
                        page_join.vecTime--;
                        if (page_join.vecTime == 0) {
                            clearInterval(timer);
                            $('#join .getVec').removeClass('disable');
                            $('#join .getVec').text('获取验证码');
                        }
                    }, 1000);

                } else {
                    layer.msg(obj.msg);
                }
            }
        },page_join);
    }
};

var page_choose = {
    isClick:false,
    btn$click:function(){
        myJsonp({
            url:BaseUrl + "Company/clerk?_method=PUT",
            data:{
                companyId:_id
            },
            success:function(obj){
                obj = $.parseJSON(obj);

                if (obj.code == 0) {
                    result('success');
                } else {
                    layer.msg(obj.msg);
                }
            }
        })
    }
};