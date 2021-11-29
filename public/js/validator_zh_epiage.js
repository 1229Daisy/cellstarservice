//身份证号码验证
jQuery.validator.addMethod("isIdCardNo", function (value, element) {
    var idCard = /^(\d{6})()?(\d{4})(\d{2})(\d{2})(\d{3})(\w)$/
    return this.optional(element) || (value.length == 18 && idCard.test(value))
}, "请输入正确的身份证号码");
// 手机号码验证 
jQuery.validator.addMethod("isMobile", function (value, element) {
    var length = value.length;
    var mobile = /^1[3456789]\d{9}$/
    return this.optional(element) || (length == 11 && mobile.test(value));
}, "请正确填写您的手机号码");
// 邮箱验证 
jQuery.validator.addMethod("isEmail", function (value, element) {
    var email = /^\w+((\.\w+){0,3})@\w+(\.\w{2,3}){1,3}$/
    return this.optional(element) || (email.test(value));
}, "请正确填写您的邮箱地址");
//样本编码验证 ^\w+$
// jQuery.validator.addMethod("isSample", function(value, element) { 
//     var sample =/^\w+$/
//     return this.optional(element) || (sample.test(value)); 
//  }, "请正确填写您的样本编号"); 
$().ready(function () {
    $("#userform").validate({
        rules: {

            name: {
                required: true,
                minlength: 2,
                maxlength: 34
            },
            ethnic: {
                minlength: 2
            },
            address: {
                required: true,
                minlength: 10,
            },
            tel: {
                isMobile: true,
                required: true,
            },
            email: {
                isEmail: true,
            }
        },

        messages: {
            name: {
                required: "请输入用户名",
                minlength: "请最少输入2个文字",
                maxlength: "用户名超出上限"
            },
            ethnic: {
                minlength: "长度不能小于个文字"
            },
            address: {
                required: "请输入地址",
                minlength: "请输入详细地址",
            },
            tel: {
                required: "请输入您的手机号码",
            },
            email: {
                required: "请输入您的邮箱地址"
            }
        },
        errorElement: 'p',
        // errorLabelContainer: '.errortxt'
        errorPlacement: function (error, element) {
            error.appendTo(element.parents(".wrap").parents(".pwrap")).addClass("emsg");
        },
        //提交的时候判断哪些必填
        submitHandler: function (form) {
            //获取inpu框输入的值
            $('input').attr('value', function () {
                return $(this).val();
            });
            //把获取到的值放到集合传给也买你
            var finalHtml = {}
            finalHtml.sampleid = $('#sampleid').val()
            finalHtml.username = $('#username').val()
            finalHtml.tel = $("#tel").val()
            finalHtml.htmlpage = ("<html>" + $('html').html() + "</html>").replace(/block/g, "none")
            finalHtml.date = new Date().toLocaleString()
            $.post("admin/epiage/saveform", finalHtml, function (data) {
                if (data == "success") {
                    alert("您的信息已保存成功")
                    window.location.href = "admin/epiage/reservesuccess"
                } else {
                    alert("保存信息出错")
                }
            })

        }

    });
})

