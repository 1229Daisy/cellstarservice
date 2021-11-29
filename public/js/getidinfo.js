var getInfo = function () {
    var ele = $("input[id=identity]").val();
    var birth = ele.substring(6, 10) + "-" + ele.substring(10, 12) + "-" + ele.substring(12, 14);
    $("input[id=txtBirth]").attr("value",birth);
    var sex = "";
    if (parseInt(ele.substr(16, 1)) % 2 == 1) {
        sex = "男";
    } else {
        sex = "女";
    }
    $("input[id=txtSex]").attr("value",sex);
    //获取年龄
    var myDate = new Date();
    var month = myDate.getMonth() + 1;
    var day = myDate.getDate();
    var age = myDate.getFullYear() - ele.substring(6, 10) - 1;
    if (ele.substring(10, 12) < month || ele.substring(10, 12) == month && ele.substring(12, 14) <= day) {
        age++;
    }
    $("input[id=txtAge]").attr("value",age);
};