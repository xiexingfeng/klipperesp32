var config_configList = [];


var currentpath = "/";
var authentication = false;
var websocket_port = 0;
var websocket_IP = "";
var async_webcommunication = false;
var page_id = "";
var ws_source;
var log_off = false;
var websocket_started = false;
var esp_error_message = "";
var esp_error_code = 0;
var xmlhttpupload;
var typeupload = 0;
function navbar() {
    var content = "<table><tr>";
    var tlist = currentpath.split("/");
    var path = "/";
    var nb = 1;
    content += "<td class='btnimg'  onclick=\"currentpath='/'; SendCommand('list','all');\">/</td>";
    while (nb < (tlist.length - 1)) {
        path += tlist[nb] + "/";
        content += "<td class='btnimg' onclick=\"currentpath='" + path + "'; SendCommand('list','all');\">" + tlist[nb] + "</td><td>/</td>";
        nb++;
    }
    content += "</tr></table>";
    return content;
}

function trash_icon() {
    var content = "<svg width='24' height='24' viewBox='0 0 128 128'>";
    content += "<rect x='52' y='12' rx='6' ry='6' width='25' height='7' style='fill:red;' />";
    content += "<rect x='52' y='16' width='25' height='2' style='fill:white;' />";
    content += "<rect x='30' y='18' rx='6' ry='6' width='67' height='100' style='fill:red;' />";
    content += "<rect x='20' y='18' rx='10' ry='10' width='87' height='14' style='fill:red;' />";
    content += "<rect x='20' y='29' width='87' height='3' style='fill:white;' />";
    content += "<rect x='40' y='43' rx='7' ry='7' width='7' height='63' style='fill:white;' />";
    content += "<rect x='60' y='43' rx='7' ry='7' width='7' height='63' style='fill:white;' />";
    content += "<rect x='80' y='43' rx='7' ry='7' width='7' height='63' style='fill:white;' /></svg>";
    return content;
}

function back_icon() {
    var content = "<svg width='24' height='24' viewBox='0 0 24 24'><path d='M7,3 L2,8 L7,13 L7,10 L17,10 L18,11 L18,15 L17,16 L10,16 L9,17 L9,19 L10,20 L20,20 L22,18 L22,8 L20,6 L7,6 z' stroke='black' fill='white' /></svg>";
    return content;
}

function select_dir(directoryname) {
    currentpath += directoryname + "/";
    SendCommand('list', 'all');
}

function compareStrings(a, b) {
    // case-insensitive comparison
    a = a.toLowerCase();
    b = b.toLowerCase();
    return (a < b) ? -1 : (a > b) ? 1 : 0;
}

function dispatchfilestatus(jsonresponse) {
    var content = "";
    var display_message = false;
    content = "&nbsp;&nbsp;Status: " + jsonresponse.status;
    content += "&nbsp;&nbsp;|&nbsp;&nbsp;Total space: " + jsonresponse.total;
    content += "&nbsp;&nbsp;|&nbsp;&nbsp;Used space: " + jsonresponse.used;
    content += "&nbsp;&nbsp;|&nbsp;&nbsp;Occupation: ";
    content += "<meter min='0' max='100' high='90' value='" + jsonresponse.occupation + "'></meter>&nbsp;" + jsonresponse.occupation + "%";
    document.getElementById('status').innerHTML = content;
    content = "";
    if (currentpath != "/") {
        var pos = currentpath.lastIndexOf("/", currentpath.length - 2);
        var previouspath = currentpath.slice(0, pos + 1);
        content += "<tr style='cursor:hand;' onclick=\"currentpath='" + previouspath + "'; SendCommand('list','all');\"><td >" + back_icon() + "</td><td colspan='4'> Up..</td></tr>";
    }
    jsonresponse.files.sort(function (a, b) {
        return compareStrings(a.name, b.name);
    });
    if (currentpath == "/") {
        display_message = true;
    }
    var display_time = false;
    for (var i1 = 0; i1 < jsonresponse.files.length; i1++) {
        //first display files
        if (String(jsonresponse.files[i1].size) != "-1") {
            content += "<TR>";
            content += "<td><svg height='24' width='24' viewBox='0 0 24 24' >    <path d='M1,2 L1,21 L2,22 L16,22 L17,21 L17,6 L12,6 L12,1  L2,1 z' stroke='black' fill='white' /><line x1='12' y1='1' x2='17' y2='6' stroke='black' stroke-width='1'/>";
            content += "</svg></td>";
            content += "<TD class='btnimg' style=\"padding:0px;\"><a href=\"" + jsonresponse.path + jsonresponse.files[i1].name + "\" target=_blank><div class=\"blacklink\">";
            content += jsonresponse.files[i1].name;
            if ((jsonresponse.files[i1].name == "index.html.gz") || (jsonresponse.files[i1].name == "index.html")) {
                display_message = false;
            }
            content += "</div></a></TD><TD>";
            content += jsonresponse.files[i1].size;
            content += "</TD>";
            if (jsonresponse.files[i1].hasOwnProperty('time')) {
                display_time = true;
                content += "<TD>";
                content += jsonresponse.files[i1].time;
                content += "</TD>";
            } else {
                content += "<TD></TD>";
            }
            content += "<TD width='0%'><div class=\"btnimg\" onclick=\"Delete('" + jsonresponse.files[i1].name + "')\">";
            content += trash_icon();
            content += "</div></TD><td></td></TR>";
        }
    }
    //then display directories
    for (var i2 = 0; i2 < jsonresponse.files.length; i2++) {
        if (String(jsonresponse.files[i2].size) == "-1") {
            content += "<TR><td><svg height='24' width='24' viewBox='0 0 24 24' ><path d='M19,11 L19,8 L18,7 L8,7 L8,5 L7,4 L2,4 L1,5 L1,22 L19,22 L20,21 L23,11 L5,11 L2,21 L1,22' stroke='black' fill='white' /></svg></td>";
            content += "<TD  class='btnimg blacklink' style='padding:10px 15px;' onclick=\"select_dir('" + jsonresponse.files[i2].name + "');\">";
            content += jsonresponse.files[i2].name;
            content += "</TD><TD></TD><TD></TD>";
            if (typeof jsonresponse.files[i2].hasOwnProperty('time')) {
                display_time = true;
            }
            content += "<TD width='0%'><div class=\"btnimg\" onclick=\"Deletedir('" + jsonresponse.files[i2].name + "')\">";
            content += trash_icon();
            content += "</div></TD><td></td></TR>";
        }
    }
    if (display_time) {
        document.getElementById('FS_time').innerHTML = "";
    } else {
        document.getElementById('FS_time').innerHTML = "Time";
    }
    if (display_message) {

        document.getElementById('MSG').innerHTML = "File index.html.gz is missing, please upload it";
    } else {
        document.getElementById('MSG').innerHTML = "<a href='/' class= 'btn btn-primary'>Go to ESP3D interface</a>";
    }
    document.getElementById('file_list').innerHTML = content;
    document.getElementById('path').innerHTML = navbar();
}

function Delete(filename) {
    if (confirm("Confirm deletion of file: " + filename)) SendCommand("delete", filename);
}

function Deletedir(filename) {
    if (confirm("Confirm deletion of directory: " + filename)) SendCommand("deletedir", filename);
}

function Createdir() {
    var filename = prompt("Directory name", "");
    if (filename != null) {
        SendCommand("createdir", filename.trim());
    }
}

function SendCommand(action, filename) {
    var xmlhttp = new XMLHttpRequest();
    var url = "/files?action=" + action;
    document.getElementById('MSG').innerHTML = "Connecting...";
    url += "&filename=" + encodeURI(filename);
    url += "&path=" + encodeURI(currentpath);
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4) {
            if (xmlhttp.status == 200) {
                var jsonresponse = JSON.parse(xmlhttp.responseText);
                dispatchfilestatus(jsonresponse);
            } else {
                if (xmlhttp.status == 401) {
                    RL();
                } else {
                    console.log(xmlhttp.status);
                    FWError();
                }
            }
        }
    };
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

function Sendfile() {
    var files = document.getElementById('file-select').files;
    if (files.length == 0) return;
    document.getElementById('upload-button').value = "Uploading...";
    document.getElementById('prg').style.visibility = "visible";
    var formData = new FormData();
    formData.append('path', currentpath);
    for (var i3 = 0; i3 < files.length; i3++) {
        var file = files[i3];
        var arg = currentpath + file.name + "S";
        //append file size first to check updload is complete
        formData.append(arg, file.size);
        formData.append('myfiles[]', file, currentpath + file.name);
    }
    xmlhttpupload = new XMLHttpRequest();
    xmlhttpupload.open('POST', '/files', true);
    //progress upload event
    xmlhttpupload.upload.addEventListener("progress", updateProgress, false);
    //progress function
    function updateProgress(oEvent) {
        if (oEvent.lengthComputable) {
            var percentComplete = (oEvent.loaded / oEvent.total) * 100;
            document.getElementById('prg').value = percentComplete;
            document.getElementById('upload-button').value = "Uploading ..." + percentComplete.toFixed(0) + "%";
        } else {
            // Impossible because size is unknown
        }
    }
    typeupload = 1;
    xmlhttpupload.onload = function () {
        if (xmlhttpupload.status === 200) {
            document.getElementById('upload-button').value = 'Upload';
            document.getElementById('prg').style.visibility = "hidden";
            document.getElementById('file-select').value = "";
            var jsonresponse = JSON.parse(xmlhttpupload.responseText);
            dispatchfilestatus(jsonresponse);
        } else uploadError();
    };

    xmlhttpupload.send(formData);
}

function padNumber(num, size) {
    var s = num.toString();
    while (s.length < size) s = "0" + s;
    return s;
}
function getPCTime() {
    var d = new Date();
    return d.getFullYear() + "-" + padNumber(d.getMonth() + 1, 2) + "-" + padNumber(d.getDate(), 2) + "-" + padNumber(d.getHours(), 2) + "-" + padNumber(d.getMinutes(), 2) + "-" + padNumber(d.getSeconds(), 2);
}

function HideAll(msg) {
    //console.log("Hide all:" + msg);
    log_off = true;
    if (websocket_started) {
        ws_source.close();
    }
    document.title = document.title + "(disconnected)";
    document.getElementById('MSG').innerHTML = msg;
    document.getElementById('FILESYSTEM').style.display = "none";
    document.getElementById('FWUPDATE').style.display = "none";
}

function FWError() {
    HideAll("Failed to communicate with FW!");
}

function FWOk() {
    document.getElementById('MSG').innerHTML = "Connected";
    document.getElementById('FILESYSTEM').style.display = "block";
    document.getElementById('FWUPDATE').style.display = "block";
}

function InitUI() {
    var xmlhttp = new XMLHttpRequest();
    var url = "/command?commandText=" + encodeURI("[ESP800]");
    authentication = false;
    async_webcommunication = false;
    console.log("Init UI");
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4) {
            var error = false;
            if (xmlhttp.status == 200) {
                var response = xmlhttp.responseText;
                var nbitem = 0;
                var tresp = response.split("#");
                console.log(xmlhttp.responseText);
                if (tresp.length < 3) {
                    error = true;
                } else {
                    //FW version:1.1f # FW target:grbl-embedded  # FW HW:Direct SD  # primary sd:/sd # secondary sd:none # authentication:no # webcommunication: Sync: 81:192.168.0.1 # hostname:grblesp # axis:3
                    //FW version:bugfix-2.0.x # FW target:marlin-embedded  # FW HW:Direct SD  # primary sd:/sd # secondary sd:none # authentication:no # webcommunication: Sync: 81# hostname:marlinesp
                    for (var p = 0; p < tresp.length; p++) {
                        var sublist = tresp[p].split(":");
                        if (sublist[0].trim() == "FW version") {
                            document.getElementById('FWVERSION').innerHTML = "v" + sublist[1];
                            nbitem++;
                        }
                        if (sublist[0].trim() == "authentication") {
                            if (sublist[1].trim() == "no") {
                                authentication = false;
                                document.getElementById('loginicon').style.visibility = "hidden";
                            }
                            else {
                                authentication = true;
                                document.getElementById('loginicon').style.visibility = "visible";
                            }
                            nbitem++;
                        }
                        if (sublist[0].trim() == "webcommunication") {
                            websocket_port = sublist[2].trim();
                            websocket_IP = sublist[3].trim();
                            startSocket();
                            nbitem++;
                        }
                        if (sublist[0].trim() == "hostname") {
                            document.title = sublist[1].trim();
                            nbitem++
                        }
                    }
                    if (nbitem == 4) {
                        SendCommand('list', 'all');
                        FWOk();
                    } else {
                        error = true;

                    }
                }


            } else if (xmlhttp.status == 401) {
                RL();
            } else {
                error = true;
                console.log(xmlhttp.status);
            }
            if (error) {
                FWError();
            }
        }
    };
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

function startSocket() {
    if (websocket_started) {
        ws_source.close();
    }
    if (async_webcommunication) {
        ws_source = new WebSocket('ws://' + websocket_IP + ':' + websocket_port + '/ws', ['arduino']);
    }
    else {
        //console.log("Socket port is :" + websocket_port);
        ws_source = new WebSocket('ws://' + websocket_IP + ':' + websocket_port, ['arduino']);
    }
    ws_source.binaryType = "arraybuffer";
    ws_source.onopen = function (e) {
        console.log("WS");
        websocket_started = true;
    };
    ws_source.onclose = function (e) {
        websocket_started = false;
        console.log("~WS");
        //seems sometimes it disconnect so wait 3s and reconnect
        //if it is not a log off
        if (!log_off) setTimeout(startSocket, 3000);
    };
    ws_source.onerror = function (e) {
        console.log("WS", e);
    };
    ws_source.onmessage = function (e) {
        var msg = "";
        //bin
        if (!(e.data instanceof ArrayBuffer)) {
            msg = e.data;
            var tval = msg.split(":");
            if (tval.length >= 2) {
                if (tval[0] == 'currentID') {
                    page_id = tval[1];
                    console.log("ID " + page_id);
                }
                if (tval[0] == 'activeID') {
                    if (page_id != tval[1]) {
                        HideAll("It seems you are connect from another location, your are now disconnected");
                    }
                }
                if (tval[0] == 'ERROR') {
                    esp_error_message = tval[2];
                    esp_error_code = tval[1];
                    console.log(tval[2] + " code:" + tval[1]);
                    uploadError();
                    xmlhttpupload.abort();
                }
            }

        }
        //console.log(msg);

    };
}

window.onload = function () {
    // var json = '{"name":"BeJson","result":[{"comment":"Google","label":"label....","defaultvalue":"1234","help":"help"},{"comment":"Google","label":"label....","defaultvalue":"1234","help":"help"},{"comment":"Google","label":"label....","defaultvalue":"1234","help":"help"}]}';

    // config_configList = JSON.parse(json).result;

    // build_HTML_config_list();

    refreshconfig();

    // InitUI();
};

function uploadError() {
    if (esp_error_code != 0) {
        alert('Update failed(' + esp_error_code + '): ' + esp_error_message);
        esp_error_code = 0;
    } else {
        alert('Update failed!');
    }

    if (typeupload == 1) {
        //location.reload();
        document.getElementById('upload-button').value = 'Upload';
        document.getElementById('prg').style.visibility = "hidden";
        document.getElementById('file-select').value = "";
        SendCommand('list', 'all');
    } else {
        location.reload();
    }
}

function Uploadfile() {
    if (!confirm("Confirm Firmware Update ?")) return;
    var files = document.getElementById('fw-select').files;
    if (files.length == 0) return;
    document.getElementById('ubut').style.visibility = 'hidden';
    document.getElementById('fw-select').style.visibility = 'hidden';
    document.getElementById('msg').style.visibility = "visible";
    document.getElementById('msg').innerHTML = "";
    document.getElementById('FILESYSTEM').style.display = "none";
    document.getElementById('prgfw').style.visibility = "visible";
    var formData = new FormData();
    for (var i4 = 0; i4 < files.length; i4++) {
        var file = files[i4];
        var arg = "/" + file.name + "S";
        //append file size first to check updload is complete
        formData.append(arg, file.size);
        formData.append('myfile[]', file, "/" + file.name);
    }
    typeupload = 0;
    xmlhttpupload = new XMLHttpRequest();
    xmlhttpupload.open('POST', '/updatefw', true);
    //progress upload event
    xmlhttpupload.addEventListener("progress", updateProgress, false);
    //progress function
    function updateProgress(oEvent) {
        if (oEvent.lengthComputable) {
            var percentComplete = (oEvent.loaded / oEvent.total) * 100;
            document.getElementById('prgfw').value = percentComplete;
            document.getElementById('msg').innerHTML = "Uploading ..." + percentComplete.toFixed(0) + "%";
        } else {
            // Impossible because size is unknown
        }
    }
    xmlhttpupload.onload = function () {
        if (xmlhttpupload.status === 200) {
            document.getElementById('ubut').value = 'Upload';
            document.getElementById('msg').innerHTML = "Restarting, please wait....";
            document.getElementById('counter').style.visibility = "visible";
            document.getElementById('ubut').style.visibility = 'hidden';
            document.getElementById('ubut').style.width = '0px';
            document.getElementById('fw-select').value = "";
            document.getElementById('fw-select').style.visibility = 'hidden';
            document.getElementById('fw-select').style.width = '0px';

            console.log(xmlhttpupload.responseText);
            var jsonresponse = JSON.parse(xmlhttpupload.responseText);
            if (jsonresponse.status == '1' || jsonresponse.status == '4' || jsonresponse.status == '1') uploadError();
            if (jsonresponse.status == '2') alert('Update canceled!');
            else if (jsonresponse.status == '3') {
                var i5 = 0;
                var interval;
                var x = document.getElementById("prgfw");
                x.max = 40;
                interval = setInterval(function () {
                    i5 = i5 + 1;
                    var x = document.getElementById("prgfw");
                    x.value = i5;
                    document.getElementById('counter').innerHTML = 41 - i5;
                    if (i5 > 40) {
                        clearInterval(interval);
                        location.reload();
                    }
                }, 1000);
            }
            else uploadError()
        } else uploadError()
    };
    xmlhttpupload.send(formData);
}


function RL() {
    document.getElementById('loginpage').style.display = 'block';
}

function SLR() {
    document.getElementById('loginpage').style.display = 'none';
    var user = document.getElementById('lut').value.trim();
    var password = document.getElementById('lpt').value.trim();
    var url = "/login?USER=" + encodeURIComponent(user) + "&PASSWORD=" + encodeURIComponent(password) + "&SUBMIT=yes";
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4) {
            if (xmlhttp.status != 200) {
                if (xmlhttp.status == 401) {
                    RL();
                } else {
                    FWError();
                    console.log(xmlhttp.status);
                }
            } else {
                InitUI();
            }
        }
    };
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}




function build_HTML_config_list() {
    var content = "";
    for (var i = 0; i < config_configList.length; i++) {
        // content += "<tr>";

        // content += "<td colspan='3' class='info'>";
        // content += config_configList[i].comment;
        // content += "</td>";
        // content += "</tr>\n";

        content += "<tr class='trClass'>";
        content += "<td style='vertical-align:middle'>";
        content += config_configList[i].label;
        content += "</td>";
        content += "<td style='vertical-align:middle'>";
        content += "<div class='input-group'>";
        content += "<span class='input-group-btn'>";
        content += "<button class='btn btn-default' onclick='config_revert_to_default(" + i + ")' >";
        content += get_icon_svg("repeat");
        content += "</button>";
        content += "</span>";
        content += "<div id='status_config_" + i + "' class='form-group has-feedback' >";
        content += "<input id='config_" + i + "' type='text' class='form-control' style='width:auto'  value='" + config_configList[i].defaultvalue + "' onkeyup='config_checkchange(" + i + ")' >";
        content += "<span id='icon_config_" + i + "'class='form-control-feedback' ></span>";
        content += "</div>";
        content += "<span class='input-group-btn'>";
        content += "<button  id='btn_config_" + i + "' class='btn btn-default' onclick='configetvalue(" + i + ")' translate english_content='Set' >" + "Set" + "</button>&nbsp;";
        content += "</span>";
        content += "</div>";
        content += "</td>";
        content += "<td style='vertical-align:middle'>";
        content += HTMLEncode(config_configList[i].help);

        content += "</td>";
        content += "</tr>\n";
    }
    if (content.length > 0) document.getElementById('config_list_data').innerHTML = content;
}



function HTMLEncode(str) {
    var i = str.length,
        aRet = [];

    while (i--) {
        var iC = str[i].charCodeAt();
        if (iC < 65 || iC > 127 || (iC > 90 && iC < 97)) {
            if (iC == 65533) iC = 176;
            aRet[i] = '&#' + iC + ';';
        } else {
            aRet[i] = str[i];
        }
    }
    return aRet.join('');
}

function config_revert_to_default(index) {
    document.getElementById('config_' + index).value = config_configList[index].defaultvalue
    document.getElementById('btn_config_' + index).className = "btn btn-default";
    document.getElementById('status_config_' + index).className = "form-group has-feedback";
    document.getElementById('icon_config_' + index).innerHTML = "";
}

function config_checkchange(index) {
    //console.log("check " + "config_"+index);
    var val = document.getElementById('config_' + index).value.trim();
    //console.log("value: " + val);
    if (config_configList[index].defaultvalue == val) {
        document.getElementById('btn_config_' + index).className = "btn btn-default";
        document.getElementById('icon_config_' + index).className = "form-control-feedback";
        document.getElementById('icon_config_' + index).innerHTML = "";
        document.getElementById('status_config_' + index).className = "form-group has-feedback";
    }
    else if (config_check_value(val, index)) {
        document.getElementById('status_config_' + index).className = "form-group has-feedback has-warning";
        document.getElementById('btn_config_' + index).className = "btn btn-warning";
        document.getElementById('icon_config_' + index).className = "form-control-feedback has-warning";
        document.getElementById('icon_config_' + index).innerHTML = get_icon_svg("warning-sign");
        //console.log("change ok");
    }
    else {
        //console.log("change bad");
        document.getElementById('btn_config_' + index).className = "btn btn-danger";
        document.getElementById('icon_config_' + index).className = "form-control-feedback has-error";
        document.getElementById('icon_config_' + index).innerHTML = get_icon_svg("remove");
        document.getElementById('status_config_' + index).className = "form-group has-feedback has-error";
    }

}

function config_check_value(value, index) {
    var isvalid = true;

    if ((value.trim()[0] == '-') || (value.length === 0) || (value.toLowerCase().indexOf("e") != -1)) {
        isvalid = false;
        // config_error_msg = translate_text_item( "cannot have '-', 'e' char or be empty");
    }

    return isvalid;
}


function refreshconfig() {
    var xmlhttp = new XMLHttpRequest();
    var url = "/config";
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4) {
            if (xmlhttp.status == 200) {
                var jsonresponse = JSON.parse(xmlhttp.responseText);
                config_configList = jsonresponse.result;
                build_HTML_config_list();
                // dispatchfilestatus(jsonresponse);
            } else {
                if (xmlhttp.status == 401) {
                    // RL();
                } else {
                    console.log(xmlhttp.status);
                    // FWError();
                }
            }
        }
    };
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

function configetvalue(index) {
    //remove possible spaces
    value = document.getElementById('config_' + index).value.trim();
    if (value == config_configList[index].defaultvalue) return;
    //check validity of value
    var isvalid = config_check_value(value, index);
    //if not valid show error
    if (!isvalid) {
        document.getElementById('btn_config_' + index).className = "btn btn-danger";
        document.getElementById('icon_config_' + index).className = "form-control-feedback has-error";
        document.getElementById('icon_config_' + index).innerHTML = get_icon_svg("remove");
        document.getElementById('status_config_' + index).className = "form-group has-feedback has-error";
        alertdlg(translate_text_item("Out of range"), translate_text_item("Value must be ") + config_error_msg + " !");
    } else {
        //value is ok save it
        var key = config_configList[index].key;
        var keytype = config_configList[index].keytype;
        // config_lastindex = index;
        config_configList[index].defaultvalue = value; 
        document.getElementById('btn_config_' + index).className = "btn btn-success";
        document.getElementById('icon_config_' + index).className = "form-control-feedback has-success";
        document.getElementById('icon_config_' + index).innerHTML = get_icon_svg("ok");
        document.getElementById('status_config_' + index).className = "form-group has-feedback has-success";
        var url = "/setparam?key=" + key + "&value=" + value + "&keytype=" + keytype;//+encodeURIComponent(cmd);
        // url = encodeURIComponent(url);

        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4) {
                if (xmlhttp.status == 200) {
                    var jsonresponse = JSON.parse(xmlhttp.responseText);

                    // dispatchfilestatus(jsonresponse);
                } else {
                    if (xmlhttp.status == 401) {
                        // RL();
                    } else {
                        console.log(xmlhttp.status);
                        // FWError();
                    }
                }
            }
        };
        xmlhttp.open("GET", url, true);
        xmlhttp.send();
    }
}




//bootstrap icons
var list_icon = {
    "hourglass": "M1000 1200v-150q0 -21 -14.5 -35.5t-35.5 -14.5h-50v-100q0 -91 -49.5 -165.5t-130.5 -109.5q81 -35 130.5 -109.5t49.5 -165.5v-150h50q21 0 35.5 -14.5t14.5 -35.5v-150h-800v150q0 21 14.5 35.5t35.5 14.5h50v150q0 91 49.5 165.5t130.5 109.5q-81 35 -130.5 109.5 t-49.5 165.5v100h-50q-21 0 -35.5 14.5t-14.5 35.5v150h800zM400 1000v-100q0 -60 32.5 -109.5t87.5 -73.5q28 -12 44 -37t16 -55t-16 -55t-44 -37q-55 -24 -87.5 -73.5t-32.5 -109.5v-150h400v150q0 60 -32.5 109.5t-87.5 73.5q-28 12 -44 37t-16 55t16 55t44 37 q55 24 87.5 73.5t32.5 109.5v100h-400z",
    "cloud": "M503 1089q110 0 200.5 -59.5t134.5 -156.5q44 14 90 14q120 0 205 -86.5t85 -206.5q0 -121 -85 -207.5t-205 -86.5h-750q-79 0 -135.5 57t-56.5 137q0 69 42.5 122.5t108.5 67.5q-2 12 -2 37q0 153 108 260.5t260 107.5z",
    "envelope": "M25 1100h1150q10 0 12.5 -5t-5.5 -13l-564 -567q-8 -8 -18 -8t-18 8l-564 567q-8 8 -5.5 13t12.5 5zM18 882l264 -264q8 -8 8 -18t-8 -18l-264 -264q-8 -8 -13 -5.5t-5 12.5v550q0 10 5 12.5t13 -5.5zM918 618l264 264q8 8 13 5.5t5 -12.5v-550q0 -10 -5 -12.5t-13 5.5 l-264 264q-8 8 -8 18t8 18zM818 482l364 -364q8 -8 5.5 -13t-12.5 -5h-1150q-10 0 -12.5 5t5.5 13l364 364q8 8 18 8t18 -8l164 -164q8 -8 18 -8t18 8l164 164q8 8 18 8t18 -8z",
    "pencil": "M1011 1210q19 0 33 -13l153 -153q13 -14 13 -33t-13 -33l-99 -92l-214 214l95 96q13 14 32 14zM1013 800l-615 -614l-214 214l614 614zM317 96l-333 -112l110 335z",
    "music": "M368 1017l645 163q39 15 63 0t24 -49v-831q0 -55 -41.5 -95.5t-111.5 -63.5q-79 -25 -147 -4.5t-86 75t25.5 111.5t122.5 82q72 24 138 8v521l-600 -155v-606q0 -42 -44 -90t-109 -69q-79 -26 -147 -5.5t-86 75.5t25.5 111.5t122.5 82.5q72 24 138 7v639q0 38 14.5 59 t53.5 34z",
    "search": "M500 1191q100 0 191 -39t156.5 -104.5t104.5 -156.5t39 -191l-1 -2l1 -5q0 -141 -78 -262l275 -274q23 -26 22.5 -44.5t-22.5 -42.5l-59 -58q-26 -20 -46.5 -20t-39.5 20l-275 274q-119 -77 -261 -77l-5 1l-2 -1q-100 0 -191 39t-156.5 104.5t-104.5 156.5t-39 191 t39 191t104.5 156.5t156.5 104.5t191 39zM500 1022q-88 0 -162 -43t-117 -117t-43 -162t43 -162t117 -117t162 -43t162 43t117 117t43 162t-43 162t-117 117t-162 43z",
    "heart": "M649 949q48 68 109.5 104t121.5 38.5t118.5 -20t102.5 -64t71 -100.5t27 -123q0 -57 -33.5 -117.5t-94 -124.5t-126.5 -127.5t-150 -152.5t-146 -174q-62 85 -145.5 174t-150 152.5t-126.5 127.5t-93.5 124.5t-33.5 117.5q0 64 28 123t73 100.5t104 64t119 20 t120.5 -38.5t104.5 -104z",
    "star": "M407 800l131 353q7 19 17.5 19t17.5 -19l129 -353h421q21 0 24 -8.5t-14 -20.5l-342 -249l130 -401q7 -20 -0.5 -25.5t-24.5 6.5l-343 246l-342 -247q-17 -12 -24.5 -6.5t-0.5 25.5l130 400l-347 251q-17 12 -14 20.5t23 8.5h429z",
    "star-empty": "M407 800l131 353q7 19 17.5 19t17.5 -19l129 -353h421q21 0 24 -8.5t-14 -20.5l-342 -249l130 -401q7 -20 -0.5 -25.5t-24.5 6.5l-343 246l-342 -247q-17 -12 -24.5 -6.5t-0.5 25.5l130 400l-347 251q-17 12 -14 20.5t23 8.5h429zM477 700h-240l197 -142l-74 -226 l193 139l195 -140l-74 229l192 140h-234l-78 211z",
    "user": "M600 1200q124 0 212 -88t88 -212v-250q0 -46 -31 -98t-69 -52v-75q0 -10 6 -21.5t15 -17.5l358 -230q9 -5 15 -16.5t6 -21.5v-93q0 -10 -7.5 -17.5t-17.5 -7.5h-1150q-10 0 -17.5 7.5t-7.5 17.5v93q0 10 6 21.5t15 16.5l358 230q9 6 15 17.5t6 21.5v75q-38 0 -69 52 t-31 98v250q0 124 88 212t212 88z",
    "th-large": "M50 1100h400q21 0 35.5 -14.5t14.5 -35.5v-400q0 -21 -14.5 -35.5t-35.5 -14.5h-400q-21 0 -35.5 14.5t-14.5 35.5v400q0 21 14.5 35.5t35.5 14.5zM650 1100h400q21 0 35.5 -14.5t14.5 -35.5v-400q0 -21 -14.5 -35.5t-35.5 -14.5h-400q-21 0 -35.5 14.5t-14.5 35.5v400 q0 21 14.5 35.5t35.5 14.5zM50 500h400q21 0 35.5 -14.5t14.5 -35.5v-400q0 -21 -14.5 -35.5t-35.5 -14.5h-400q-21 0 -35.5 14.5t-14.5 35.5v400q0 21 14.5 35.5t35.5 14.5zM650 500h400q21 0 35.5 -14.5t14.5 -35.5v-400q0 -21 -14.5 -35.5t-35.5 -14.5h-400 q-21 0 -35.5 14.5t-14.5 35.5v400q0 21 14.5 35.5t35.5 14.5z",
    "th": "M50 1100h200q21 0 35.5 -14.5t14.5 -35.5v-200q0 -21 -14.5 -35.5t-35.5 -14.5h-200q-21 0 -35.5 14.5t-14.5 35.5v200q0 21 14.5 35.5t35.5 14.5zM450 1100h200q21 0 35.5 -14.5t14.5 -35.5v-200q0 -21 -14.5 -35.5t-35.5 -14.5h-200q-21 0 -35.5 14.5t-14.5 35.5v200 q0 21 14.5 35.5t35.5 14.5zM850 1100h200q21 0 35.5 -14.5t14.5 -35.5v-200q0 -21 -14.5 -35.5t-35.5 -14.5h-200q-21 0 -35.5 14.5t-14.5 35.5v200q0 21 14.5 35.5t35.5 14.5zM50 700h200q21 0 35.5 -14.5t14.5 -35.5v-200q0 -21 -14.5 -35.5t-35.5 -14.5h-200 q-21 0 -35.5 14.5t-14.5 35.5v200q0 21 14.5 35.5t35.5 14.5zM450 700h200q21 0 35.5 -14.5t14.5 -35.5v-200q0 -21 -14.5 -35.5t-35.5 -14.5h-200q-21 0 -35.5 14.5t-14.5 35.5v200q0 21 14.5 35.5t35.5 14.5zM850 700h200q21 0 35.5 -14.5t14.5 -35.5v-200 q0 -21 -14.5 -35.5t-35.5 -14.5h-200q-21 0 -35.5 14.5t-14.5 35.5v200q0 21 14.5 35.5t35.5 14.5zM50 300h200q21 0 35.5 -14.5t14.5 -35.5v-200q0 -21 -14.5 -35.5t-35.5 -14.5h-200q-21 0 -35.5 14.5t-14.5 35.5v200q0 21 14.5 35.5t35.5 14.5zM450 300h200 q21 0 35.5 -14.5t14.5 -35.5v-200q0 -21 -14.5 -35.5t-35.5 -14.5h-200q-21 0 -35.5 14.5t-14.5 35.5v200q0 21 14.5 35.5t35.5 14.5zM850 300h200q21 0 35.5 -14.5t14.5 -35.5v-200q0 -21 -14.5 -35.5t-35.5 -14.5h-200q-21 0 -35.5 14.5t-14.5 35.5v200q0 21 14.5 35.5 t35.5 14.5z",
    "th-list": "M50 1100h200q21 0 35.5 -14.5t14.5 -35.5v-200q0 -21 -14.5 -35.5t-35.5 -14.5h-200q-21 0 -35.5 14.5t-14.5 35.5v200q0 21 14.5 35.5t35.5 14.5zM450 1100h700q21 0 35.5 -14.5t14.5 -35.5v-200q0 -21 -14.5 -35.5t-35.5 -14.5h-700q-21 0 -35.5 14.5t-14.5 35.5v200 q0 21 14.5 35.5t35.5 14.5zM50 700h200q21 0 35.5 -14.5t14.5 -35.5v-200q0 -21 -14.5 -35.5t-35.5 -14.5h-200q-21 0 -35.5 14.5t-14.5 35.5v200q0 21 14.5 35.5t35.5 14.5zM450 700h700q21 0 35.5 -14.5t14.5 -35.5v-200q0 -21 -14.5 -35.5t-35.5 -14.5h-700 q-21 0 -35.5 14.5t-14.5 35.5v200q0 21 14.5 35.5t35.5 14.5zM50 300h200q21 0 35.5 -14.5t14.5 -35.5v-200q0 -21 -14.5 -35.5t-35.5 -14.5h-200q-21 0 -35.5 14.5t-14.5 35.5v200q0 21 14.5 35.5t35.5 14.5zM450 300h700q21 0 35.5 -14.5t14.5 -35.5v-200 q0 -21 -14.5 -35.5t-35.5 -14.5h-700q-21 0 -35.5 14.5t-14.5 35.5v200q0 21 14.5 35.5t35.5 14.5z",
    "ok": "M465 477l571 571q8 8 18 8t17 -8l177 -177q8 -7 8 -17t-8 -18l-783 -784q-7 -8 -17.5 -8t-17.5 8l-384 384q-8 8 -8 18t8 17l177 177q7 8 17 8t18 -8l171 -171q7 -7 18 -7t18 7z",
    "remove": "M904 1083l178 -179q8 -8 8 -18.5t-8 -17.5l-267 -268l267 -268q8 -7 8 -17.5t-8 -18.5l-178 -178q-8 -8 -18.5 -8t-17.5 8l-268 267l-268 -267q-7 -8 -17.5 -8t-18.5 8l-178 178q-8 8 -8 18.5t8 17.5l267 268l-267 268q-8 7 -8 17.5t8 18.5l178 178q8 8 18.5 8t17.5 -8 l268 -267l268 268q7 7 17.5 7t18.5 -7z",
    "zoom-in": "M507 1177q98 0 187.5 -38.5t154.5 -103.5t103.5 -154.5t38.5 -187.5q0 -141 -78 -262l300 -299q8 -8 8 -18.5t-8 -18.5l-109 -108q-7 -8 -17.5 -8t-18.5 8l-300 299q-119 -77 -261 -77q-98 0 -188 38.5t-154.5 103t-103 154.5t-38.5 188t38.5 187.5t103 154.5 t154.5 103.5t188 38.5zM506.5 1023q-89.5 0 -165.5 -44t-120 -120.5t-44 -166t44 -165.5t120 -120t165.5 -44t166 44t120.5 120t44 165.5t-44 166t-120.5 120.5t-166 44zM425 900h150q10 0 17.5 -7.5t7.5 -17.5v-75h75q10 0 17.5 -7.5t7.5 -17.5v-150q0 -10 -7.5 -17.5 t-17.5 -7.5h-75v-75q0 -10 -7.5 -17.5t-17.5 -7.5h-150q-10 0 -17.5 7.5t-7.5 17.5v75h-75q-10 0 -17.5 7.5t-7.5 17.5v150q0 10 7.5 17.5t17.5 7.5h75v75q0 10 7.5 17.5t17.5 7.5z",
    "zoom-out": "M507 1177q98 0 187.5 -38.5t154.5 -103.5t103.5 -154.5t38.5 -187.5q0 -141 -78 -262l300 -299q8 -8 8 -18.5t-8 -18.5l-109 -108q-7 -8 -17.5 -8t-18.5 8l-300 299q-119 -77 -261 -77q-98 0 -188 38.5t-154.5 103t-103 154.5t-38.5 188t38.5 187.5t103 154.5 t154.5 103.5t188 38.5zM506.5 1023q-89.5 0 -165.5 -44t-120 -120.5t-44 -166t44 -165.5t120 -120t165.5 -44t166 44t120.5 120t44 165.5t-44 166t-120.5 120.5t-166 44zM325 800h350q10 0 17.5 -7.5t7.5 -17.5v-150q0 -10 -7.5 -17.5t-17.5 -7.5h-350q-10 0 -17.5 7.5 t-7.5 17.5v150q0 10 7.5 17.5t17.5 7.5z",
    "off": "M550 1200h100q21 0 35.5 -14.5t14.5 -35.5v-400q0 -21 -14.5 -35.5t-35.5 -14.5h-100q-21 0 -35.5 14.5t-14.5 35.5v400q0 21 14.5 35.5t35.5 14.5zM800 975v166q167 -62 272 -209.5t105 -331.5q0 -117 -45.5 -224t-123 -184.5t-184.5 -123t-224 -45.5t-224 45.5 t-184.5 123t-123 184.5t-45.5 224q0 184 105 331.5t272 209.5v-166q-103 -55 -165 -155t-62 -220q0 -116 57 -214.5t155.5 -155.5t214.5 -57t214.5 57t155.5 155.5t57 214.5q0 120 -62 220t-165 155z",
    "signal": "M1025 1200h150q10 0 17.5 -7.5t7.5 -17.5v-1150q0 -10 -7.5 -17.5t-17.5 -7.5h-150q-10 0 -17.5 7.5t-7.5 17.5v1150q0 10 7.5 17.5t17.5 7.5zM725 800h150q10 0 17.5 -7.5t7.5 -17.5v-750q0 -10 -7.5 -17.5t-17.5 -7.5h-150q-10 0 -17.5 7.5t-7.5 17.5v750 q0 10 7.5 17.5t17.5 7.5zM425 500h150q10 0 17.5 -7.5t7.5 -17.5v-450q0 -10 -7.5 -17.5t-17.5 -7.5h-150q-10 0 -17.5 7.5t-7.5 17.5v450q0 10 7.5 17.5t17.5 7.5zM125 300h150q10 0 17.5 -7.5t7.5 -17.5v-250q0 -10 -7.5 -17.5t-17.5 -7.5h-150q-10 0 -17.5 7.5t-7.5 17.5 v250q0 10 7.5 17.5t17.5 7.5z",
    "cog": "M600 1174q33 0 74 -5l38 -152l5 -1q49 -14 94 -39l5 -2l134 80q61 -48 104 -105l-80 -134l3 -5q25 -44 39 -93l1 -6l152 -38q5 -43 5 -73q0 -34 -5 -74l-152 -38l-1 -6q-15 -49 -39 -93l-3 -5l80 -134q-48 -61 -104 -105l-134 81l-5 -3q-44 -25 -94 -39l-5 -2l-38 -151 q-43 -5 -74 -5q-33 0 -74 5l-38 151l-5 2q-49 14 -94 39l-5 3l-134 -81q-60 48 -104 105l80 134l-3 5q-25 45 -38 93l-2 6l-151 38q-6 42 -6 74q0 33 6 73l151 38l2 6q13 48 38 93l3 5l-80 134q47 61 105 105l133 -80l5 2q45 25 94 39l5 1l38 152q43 5 74 5zM600 815 q-89 0 -152 -63t-63 -151.5t63 -151.5t152 -63t152 63t63 151.5t-63 151.5t-152 63z",
    "trash": "M500 1300h300q41 0 70.5 -29.5t29.5 -70.5v-100h275q10 0 17.5 -7.5t7.5 -17.5v-75h-1100v75q0 10 7.5 17.5t17.5 7.5h275v100q0 41 29.5 70.5t70.5 29.5zM500 1200v-100h300v100h-300zM1100 900v-800q0 -41 -29.5 -70.5t-70.5 -29.5h-700q-41 0 -70.5 29.5t-29.5 70.5 v800h900zM300 800v-700h100v700h-100zM500 800v-700h100v700h-100zM700 800v-700h100v700h-100zM900 800v-700h100v700h-100z",
    "home": "M18 618l620 608q8 7 18.5 7t17.5 -7l608 -608q8 -8 5.5 -13t-12.5 -5h-175v-575q0 -10 -7.5 -17.5t-17.5 -7.5h-250q-10 0 -17.5 7.5t-7.5 17.5v375h-300v-375q0 -10 -7.5 -17.5t-17.5 -7.5h-250q-10 0 -17.5 7.5t-7.5 17.5v575h-175q-10 0 -12.5 5t5.5 13z",
    "file": "M600 1200v-400q0 -41 29.5 -70.5t70.5 -29.5h300v-650q0 -21 -14.5 -35.5t-35.5 -14.5h-800q-21 0 -35.5 14.5t-14.5 35.5v1100q0 21 14.5 35.5t35.5 14.5h450zM1000 800h-250q-21 0 -35.5 14.5t-14.5 35.5v250z",
    "time": "M600 1177q117 0 224 -45.5t184.5 -123t123 -184.5t45.5 -224t-45.5 -224t-123 -184.5t-184.5 -123t-224 -45.5t-224 45.5t-184.5 123t-123 184.5t-45.5 224t45.5 224t123 184.5t184.5 123t224 45.5zM600 1027q-116 0 -214.5 -57t-155.5 -155.5t-57 -214.5t57 -214.5 t155.5 -155.5t214.5 -57t214.5 57t155.5 155.5t57 214.5t-57 214.5t-155.5 155.5t-214.5 57zM525 900h50q10 0 17.5 -7.5t7.5 -17.5v-275h175q10 0 17.5 -7.5t7.5 -17.5v-50q0 -10 -7.5 -17.5t-17.5 -7.5h-250q-10 0 -17.5 7.5t-7.5 17.5v350q0 10 7.5 17.5t17.5 7.5z",
    "download-alt": "M550 1200h200q21 0 35.5 -14.5t14.5 -35.5v-450h191q20 0 25.5 -11.5t-7.5 -27.5l-327 -400q-13 -16 -32 -16t-32 16l-327 400q-13 16 -7.5 27.5t25.5 11.5h191v450q0 21 14.5 35.5t35.5 14.5zM1125 400h50q10 0 17.5 -7.5t7.5 -17.5v-350q0 -10 -7.5 -17.5t-17.5 -7.5 h-1050q-10 0 -17.5 7.5t-7.5 17.5v350q0 10 7.5 17.5t17.5 7.5h50q10 0 17.5 -7.5t7.5 -17.5v-175h900v175q0 10 7.5 17.5t17.5 7.5z",
    "download": "M600 1177q117 0 224 -45.5t184.5 -123t123 -184.5t45.5 -224t-45.5 -224t-123 -184.5t-184.5 -123t-224 -45.5t-224 45.5t-184.5 123t-123 184.5t-45.5 224t45.5 224t123 184.5t184.5 123t224 45.5zM600 1027q-116 0 -214.5 -57t-155.5 -155.5t-57 -214.5t57 -214.5 t155.5 -155.5t214.5 -57t214.5 57t155.5 155.5t57 214.5t-57 214.5t-155.5 155.5t-214.5 57zM525 900h150q10 0 17.5 -7.5t7.5 -17.5v-275h137q21 0 26 -11.5t-8 -27.5l-223 -275q-13 -16 -32 -16t-32 16l-223 275q-13 16 -8 27.5t26 11.5h137v275q0 10 7.5 17.5t17.5 7.5z ",
    "upload": "M600 1177q117 0 224 -45.5t184.5 -123t123 -184.5t45.5 -224t-45.5 -224t-123 -184.5t-184.5 -123t-224 -45.5t-224 45.5t-184.5 123t-123 184.5t-45.5 224t45.5 224t123 184.5t184.5 123t224 45.5zM600 1027q-116 0 -214.5 -57t-155.5 -155.5t-57 -214.5t57 -214.5 t155.5 -155.5t214.5 -57t214.5 57t155.5 155.5t57 214.5t-57 214.5t-155.5 155.5t-214.5 57zM632 914l223 -275q13 -16 8 -27.5t-26 -11.5h-137v-275q0 -10 -7.5 -17.5t-17.5 -7.5h-150q-10 0 -17.5 7.5t-7.5 17.5v275h-137q-21 0 -26 11.5t8 27.5l223 275q13 16 32 16 t32 -16z",
    "inbox": "M225 1200h750q10 0 19.5 -7t12.5 -17l186 -652q7 -24 7 -49v-425q0 -12 -4 -27t-9 -17q-12 -6 -37 -6h-1100q-12 0 -27 4t-17 8q-6 13 -6 38l1 425q0 25 7 49l185 652q3 10 12.5 17t19.5 7zM878 1000h-556q-10 0 -19 -7t-11 -18l-87 -450q-2 -11 4 -18t16 -7h150 q10 0 19.5 -7t11.5 -17l38 -152q2 -10 11.5 -17t19.5 -7h250q10 0 19.5 7t11.5 17l38 152q2 10 11.5 17t19.5 7h150q10 0 16 7t4 18l-87 450q-2 11 -11 18t-19 7z",
    "play-circle": "M600 1177q117 0 224 -45.5t184.5 -123t123 -184.5t45.5 -224t-45.5 -224t-123 -184.5t-184.5 -123t-224 -45.5t-224 45.5t-184.5 123t-123 184.5t-45.5 224t45.5 224t123 184.5t184.5 123t224 45.5zM600 1027q-116 0 -214.5 -57t-155.5 -155.5t-57 -214.5t57 -214.5 t155.5 -155.5t214.5 -57t214.5 57t155.5 155.5t57 214.5t-57 214.5t-155.5 155.5t-214.5 57zM540 820l253 -190q17 -12 17 -30t-17 -30l-253 -190q-16 -12 -28 -6.5t-12 26.5v400q0 21 12 26.5t28 -6.5z",
    "repeat": "M947 1060l135 135q7 7 12.5 5t5.5 -13v-362q0 -10 -7.5 -17.5t-17.5 -7.5h-362q-11 0 -13 5.5t5 12.5l133 133q-109 76 -238 76q-116 0 -214.5 -57t-155.5 -155.5t-57 -214.5t57 -214.5t155.5 -155.5t214.5 -57t214.5 57t155.5 155.5t57 214.5h150q0 -117 -45.5 -224 t-123 -184.5t-184.5 -123t-224 -45.5t-224 45.5t-184.5 123t-123 184.5t-45.5 224t45.5 224t123 184.5t184.5 123t224 45.5q192 0 347 -117z",
    "refresh": "M947 1060l135 135q7 7 12.5 5t5.5 -13v-361q0 -11 -7.5 -18.5t-18.5 -7.5h-361q-11 0 -13 5.5t5 12.5l134 134q-110 75 -239 75q-116 0 -214.5 -57t-155.5 -155.5t-57 -214.5h-150q0 117 45.5 224t123 184.5t184.5 123t224 45.5q192 0 347 -117zM1027 600h150 q0 -117 -45.5 -224t-123 -184.5t-184.5 -123t-224 -45.5q-192 0 -348 118l-134 -134q-7 -8 -12.5 -5.5t-5.5 12.5v360q0 11 7.5 18.5t18.5 7.5h360q10 0 12.5 -5.5t-5.5 -12.5l-133 -133q110 -76 240 -76q116 0 214.5 57t155.5 155.5t57 214.5z",
    "list-alt": "M125 1200h1050q10 0 17.5 -7.5t7.5 -17.5v-1150q0 -10 -7.5 -17.5t-17.5 -7.5h-1050q-10 0 -17.5 7.5t-7.5 17.5v1150q0 10 7.5 17.5t17.5 7.5zM1075 1000h-850q-10 0 -17.5 -7.5t-7.5 -17.5v-850q0 -10 7.5 -17.5t17.5 -7.5h850q10 0 17.5 7.5t7.5 17.5v850 q0 10 -7.5 17.5t-17.5 7.5zM325 900h50q10 0 17.5 -7.5t7.5 -17.5v-50q0 -10 -7.5 -17.5t-17.5 -7.5h-50q-10 0 -17.5 7.5t-7.5 17.5v50q0 10 7.5 17.5t17.5 7.5zM525 900h450q10 0 17.5 -7.5t7.5 -17.5v-50q0 -10 -7.5 -17.5t-17.5 -7.5h-450q-10 0 -17.5 7.5t-7.5 17.5v50 q0 10 7.5 17.5t17.5 7.5zM325 700h50q10 0 17.5 -7.5t7.5 -17.5v-50q0 -10 -7.5 -17.5t-17.5 -7.5h-50q-10 0 -17.5 7.5t-7.5 17.5v50q0 10 7.5 17.5t17.5 7.5zM525 700h450q10 0 17.5 -7.5t7.5 -17.5v-50q0 -10 -7.5 -17.5t-17.5 -7.5h-450q-10 0 -17.5 7.5t-7.5 17.5v50 q0 10 7.5 17.5t17.5 7.5zM325 500h50q10 0 17.5 -7.5t7.5 -17.5v-50q0 -10 -7.5 -17.5t-17.5 -7.5h-50q-10 0 -17.5 7.5t-7.5 17.5v50q0 10 7.5 17.5t17.5 7.5zM525 500h450q10 0 17.5 -7.5t7.5 -17.5v-50q0 -10 -7.5 -17.5t-17.5 -7.5h-450q-10 0 -17.5 7.5t-7.5 17.5v50 q0 10 7.5 17.5t17.5 7.5zM325 300h50q10 0 17.5 -7.5t7.5 -17.5v-50q0 -10 -7.5 -17.5t-17.5 -7.5h-50q-10 0 -17.5 7.5t-7.5 17.5v50q0 10 7.5 17.5t17.5 7.5zM525 300h450q10 0 17.5 -7.5t7.5 -17.5v-50q0 -10 -7.5 -17.5t-17.5 -7.5h-450q-10 0 -17.5 7.5t-7.5 17.5v50 q0 10 7.5 17.5t17.5 7.5z",
    "lock": "M900 800v200q0 83 -58.5 141.5t-141.5 58.5h-300q-82 0 -141 -59t-59 -141v-200h-100q-41 0 -70.5 -29.5t-29.5 -70.5v-600q0 -41 29.5 -70.5t70.5 -29.5h900q41 0 70.5 29.5t29.5 70.5v600q0 41 -29.5 70.5t-70.5 29.5h-100zM400 800v150q0 21 15 35.5t35 14.5h200 q20 0 35 -14.5t15 -35.5v-150h-300z",
    "flag": "M125 1100h50q10 0 17.5 -7.5t7.5 -17.5v-1075h-100v1075q0 10 7.5 17.5t17.5 7.5zM1075 1052q4 0 9 -2q16 -6 16 -23v-421q0 -6 -3 -12q-33 -59 -66.5 -99t-65.5 -58t-56.5 -24.5t-52.5 -6.5q-26 0 -57.5 6.5t-52.5 13.5t-60 21q-41 15 -63 22.5t-57.5 15t-65.5 7.5 q-85 0 -160 -57q-7 -5 -15 -5q-6 0 -11 3q-14 7 -14 22v438q22 55 82 98.5t119 46.5q23 2 43 0.5t43 -7t32.5 -8.5t38 -13t32.5 -11q41 -14 63.5 -21t57 -14t63.5 -7q103 0 183 87q7 8 18 8z",
    "volume-off": "M321 814l258 172q9 6 15 2.5t6 -13.5v-750q0 -10 -6 -13.5t-15 2.5l-258 172q-21 14 -46 14h-250q-10 0 -17.5 7.5t-7.5 17.5v350q0 10 7.5 17.5t17.5 7.5h250q25 0 46 14zM900 668l120 120q7 7 17 7t17 -7l34 -34q7 -7 7 -17t-7 -17l-120 -120l120 -120q7 -7 7 -17 t-7 -17l-34 -34q-7 -7 -17 -7t-17 7l-120 119l-120 -119q-7 -7 -17 -7t-17 7l-34 34q-7 7 -7 17t7 17l119 120l-119 120q-7 7 -7 17t7 17l34 34q7 8 17 8t17 -8z",
    "volume-down": "M321 814l258 172q9 6 15 2.5t6 -13.5v-750q0 -10 -6 -13.5t-15 2.5l-258 172q-21 14 -46 14h-250q-10 0 -17.5 7.5t-7.5 17.5v350q0 10 7.5 17.5t17.5 7.5h250q25 0 46 14zM766 900h4q10 -1 16 -10q96 -129 96 -290q0 -154 -90 -281q-6 -9 -17 -10l-3 -1q-9 0 -16 6 l-29 23q-7 7 -8.5 16.5t4.5 17.5q72 103 72 229q0 132 -78 238q-6 8 -4.5 18t9.5 17l29 22q7 5 15 5z",
    "volume-up": "M967 1004h3q11 -1 17 -10q135 -179 135 -396q0 -105 -34 -206.5t-98 -185.5q-7 -9 -17 -10h-3q-9 0 -16 6l-42 34q-8 6 -9 16t5 18q111 150 111 328q0 90 -29.5 176t-84.5 157q-6 9 -5 19t10 16l42 33q7 5 15 5zM321 814l258 172q9 6 15 2.5t6 -13.5v-750q0 -10 -6 -13.5 t-15 2.5l-258 172q-21 14 -46 14h-250q-10 0 -17.5 7.5t-7.5 17.5v350q0 10 7.5 17.5t17.5 7.5h250q25 0 46 14zM766 900h4q10 -1 16 -10q96 -129 96 -290q0 -154 -90 -281q-6 -9 -17 -10l-3 -1q-9 0 -16 6l-29 23q-7 7 -8.5 16.5t4.5 17.5q72 103 72 229q0 132 -78 238 q-6 8 -4.5 18.5t9.5 16.5l29 22q7 5 15 5z",
    "tag": "M500 1200l682 -682q8 -8 8 -18t-8 -18l-464 -464q-8 -8 -18 -8t-18 8l-682 682l1 475q0 10 7.5 17.5t17.5 7.5h474zM319.5 1024.5q-29.5 29.5 -71 29.5t-71 -29.5t-29.5 -71.5t29.5 -71.5t71 -29.5t71 29.5t29.5 71.5t-29.5 71.5z",
    "print": "M822 1200h-444q-11 0 -19 -7.5t-9 -17.5l-78 -301q-7 -24 7 -45l57 -108q6 -9 17.5 -15t21.5 -6h450q10 0 21.5 6t17.5 15l62 108q14 21 7 45l-83 301q-1 10 -9 17.5t-19 7.5zM1175 800h-150q-10 0 -21 -6.5t-15 -15.5l-78 -156q-4 -9 -15 -15.5t-21 -6.5h-550 q-10 0 -21 6.5t-15 15.5l-78 156q-4 9 -15 15.5t-21 6.5h-150q-10 0 -17.5 -7.5t-7.5 -17.5v-650q0 -10 7.5 -17.5t17.5 -7.5h150q10 0 17.5 7.5t7.5 17.5v150q0 10 7.5 17.5t17.5 7.5h750q10 0 17.5 -7.5t7.5 -17.5v-150q0 -10 7.5 -17.5t17.5 -7.5h150q10 0 17.5 7.5 t7.5 17.5v650q0 10 -7.5 17.5t-17.5 7.5zM850 200h-500q-10 0 -19.5 -7t-11.5 -17l-38 -152q-2 -10 3.5 -17t15.5 -7h600q10 0 15.5 7t3.5 17l-38 152q-2 10 -11.5 17t-19.5 7z",
    "camera": "M500 1100h200q56 0 102.5 -20.5t72.5 -50t44 -59t25 -50.5l6 -20h150q41 0 70.5 -29.5t29.5 -70.5v-600q0 -41 -29.5 -70.5t-70.5 -29.5h-1000q-41 0 -70.5 29.5t-29.5 70.5v600q0 41 29.5 70.5t70.5 29.5h150q2 8 6.5 21.5t24 48t45 61t72 48t102.5 21.5zM900 800v-100 h100v100h-100zM600 730q-95 0 -162.5 -67.5t-67.5 -162.5t67.5 -162.5t162.5 -67.5t162.5 67.5t67.5 162.5t-67.5 162.5t-162.5 67.5zM600 603q43 0 73 -30t30 -73t-30 -73t-73 -30t-73 30t-30 73t30 73t73 30z",
    "align-justify": "M50 1100h1100q21 0 35.5 -14.5t14.5 -35.5v-100q0 -21 -14.5 -35.5t-35.5 -14.5h-1100q-21 0 -35.5 14.5t-14.5 35.5v100q0 21 14.5 35.5t35.5 14.5zM50 800h1100q21 0 35.5 -14.5t14.5 -35.5v-100q0 -21 -14.5 -35.5t-35.5 -14.5h-1100q-21 0 -35.5 14.5t-14.5 35.5v100 q0 21 14.5 35.5t35.5 14.5zM50 500h1100q21 0 35.5 -14.5t14.5 -35.5v-100q0 -21 -14.5 -35.5t-35.5 -14.5h-1100q-21 0 -35.5 14.5t-14.5 35.5v100q0 21 14.5 35.5t35.5 14.5zM50 200h1100q21 0 35.5 -14.5t14.5 -35.5v-100q0 -21 -14.5 -35.5t-35.5 -14.5h-1100 q-21 0 -35.5 14.5t-14.5 35.5v100q0 21 14.5 35.5t35.5 14.5z",
    "facetime-video": "M75 1000h750q31 0 53 -22t22 -53v-650q0 -31 -22 -53t-53 -22h-750q-31 0 -53 22t-22 53v650q0 31 22 53t53 22zM1200 300l-300 300l300 300v-600z",
    "picture": "M44 1100h1112q18 0 31 -13t13 -31v-1012q0 -18 -13 -31t-31 -13h-1112q-18 0 -31 13t-13 31v1012q0 18 13 31t31 13zM100 1000v-737l247 182l298 -131l-74 156l293 318l236 -288v500h-1000zM342 884q56 0 95 -39t39 -94.5t-39 -95t-95 -39.5t-95 39.5t-39 95t39 94.5 t95 39z",
    "map-maker": "M648 1169q117 0 216 -60t156.5 -161t57.5 -218q0 -115 -70 -258q-69 -109 -158 -225.5t-143 -179.5l-54 -62q-9 8 -25.5 24.5t-63.5 67.5t-91 103t-98.5 128t-95.5 148q-60 132 -60 249q0 88 34 169.5t91.5 142t137 96.5t166.5 36zM652.5 974q-91.5 0 -156.5 -65 t-65 -157t65 -156.5t156.5 -64.5t156.5 64.5t65 156.5t-65 157t-156.5 65z",
    "adjust": "M600 1177q117 0 224 -45.5t184.5 -123t123 -184.5t45.5 -224t-45.5 -224t-123 -184.5t-184.5 -123t-224 -45.5t-224 45.5t-184.5 123t-123 184.5t-45.5 224t45.5 224t123 184.5t184.5 123t224 45.5zM600 173v854q-116 0 -214.5 -57t-155.5 -155.5t-57 -214.5t57 -214.5 t155.5 -155.5t214.5 -57z",
    "tint": "M554 1295q21 -72 57.5 -143.5t76 -130t83 -118t82.5 -117t70 -116t49.5 -126t18.5 -136.5q0 -71 -25.5 -135t-68.5 -111t-99 -82t-118.5 -54t-125.5 -23q-84 5 -161.5 34t-139.5 78.5t-99 125t-37 164.5q0 69 18 136.5t49.5 126.5t69.5 116.5t81.5 117.5t83.5 119 t76.5 131t58.5 143zM344 710q-23 -33 -43.5 -70.5t-40.5 -102.5t-17 -123q1 -37 14.5 -69.5t30 -52t41 -37t38.5 -24.5t33 -15q21 -7 32 -1t13 22l6 34q2 10 -2.5 22t-13.5 19q-5 4 -14 12t-29.5 40.5t-32.5 73.5q-26 89 6 271q2 11 -6 11q-8 1 -15 -10z",
    "edit": "M1000 1013l108 115q2 1 5 2t13 2t20.5 -1t25 -9.5t28.5 -21.5q22 -22 27 -43t0 -32l-6 -10l-108 -115zM350 1100h400q50 0 105 -13l-187 -187h-368q-41 0 -70.5 -29.5t-29.5 -70.5v-500q0 -41 29.5 -70.5t70.5 -29.5h500q41 0 70.5 29.5t29.5 70.5v182l200 200v-332 q0 -165 -93.5 -257.5t-256.5 -92.5h-400q-165 0 -257.5 92.5t-92.5 257.5v400q0 165 92.5 257.5t257.5 92.5zM1009 803l-362 -362l-161 -50l55 170l355 355z",
    "share": "M350 1100h361q-164 -146 -216 -200h-195q-41 0 -70.5 -29.5t-29.5 -70.5v-500q0 -41 29.5 -70.5t70.5 -29.5h500q41 0 70.5 29.5t29.5 70.5l200 153v-103q0 -165 -92.5 -257.5t-257.5 -92.5h-400q-165 0 -257.5 92.5t-92.5 257.5v400q0 165 92.5 257.5t257.5 92.5z M824 1073l339 -301q8 -7 8 -17.5t-8 -17.5l-340 -306q-7 -6 -12.5 -4t-6.5 11v203q-26 1 -54.5 0t-78.5 -7.5t-92 -17.5t-86 -35t-70 -57q10 59 33 108t51.5 81.5t65 58.5t68.5 40.5t67 24.5t56 13.5t40 4.5v210q1 10 6.5 12.5t13.5 -4.5z",
    "check": "M350 1100h350q60 0 127 -23l-178 -177h-349q-41 0 -70.5 -29.5t-29.5 -70.5v-500q0 -41 29.5 -70.5t70.5 -29.5h500q41 0 70.5 29.5t29.5 70.5v69l200 200v-219q0 -165 -92.5 -257.5t-257.5 -92.5h-400q-165 0 -257.5 92.5t-92.5 257.5v400q0 165 92.5 257.5t257.5 92.5z M643 639l395 395q7 7 17.5 7t17.5 -7l101 -101q7 -7 7 -17.5t-7 -17.5l-531 -532q-7 -7 -17.5 -7t-17.5 7l-248 248q-7 7 -7 17.5t7 17.5l101 101q7 7 17.5 7t17.5 -7l111 -111q8 -7 18 -7t18 7z",
    "move": "M318 918l264 264q8 8 18 8t18 -8l260 -264q7 -8 4.5 -13t-12.5 -5h-170v-200h200v173q0 10 5 12t13 -5l264 -260q8 -7 8 -17.5t-8 -17.5l-264 -265q-8 -7 -13 -5t-5 12v173h-200v-200h170q10 0 12.5 -5t-4.5 -13l-260 -264q-8 -8 -18 -8t-18 8l-264 264q-8 8 -5.5 13 t12.5 5h175v200h-200v-173q0 -10 -5 -12t-13 5l-264 265q-8 7 -8 17.5t8 17.5l264 260q8 7 13 5t5 -12v-173h200v200h-175q-10 0 -12.5 5t5.5 13z",
    "step-backward": "M250 1100h100q21 0 35.5 -14.5t14.5 -35.5v-438l464 453q15 14 25.5 10t10.5 -25v-1000q0 -21 -10.5 -25t-25.5 10l-464 453v-438q0 -21 -14.5 -35.5t-35.5 -14.5h-100q-21 0 -35.5 14.5t-14.5 35.5v1000q0 21 14.5 35.5t35.5 14.5z",
    "fast-backward": "M50 1100h100q21 0 35.5 -14.5t14.5 -35.5v-438l464 453q15 14 25.5 10t10.5 -25v-438l464 453q15 14 25.5 10t10.5 -25v-1000q0 -21 -10.5 -25t-25.5 10l-464 453v-438q0 -21 -10.5 -25t-25.5 10l-464 453v-438q0 -21 -14.5 -35.5t-35.5 -14.5h-100q-21 0 -35.5 14.5 t-14.5 35.5v1000q0 21 14.5 35.5t35.5 14.5z",
    "backward": "M1200 1050v-1000q0 -21 -10.5 -25t-25.5 10l-464 453v-438q0 -21 -10.5 -25t-25.5 10l-492 480q-15 14 -15 35t15 35l492 480q15 14 25.5 10t10.5 -25v-438l464 453q15 14 25.5 10t10.5 -25z",
    "play": "M243 1074l814 -498q18 -11 18 -26t-18 -26l-814 -498q-18 -11 -30.5 -4t-12.5 28v1000q0 21 12.5 28t30.5 -4z",
    "pause": "M250 1000h200q21 0 35.5 -14.5t14.5 -35.5v-800q0 -21 -14.5 -35.5t-35.5 -14.5h-200q-21 0 -35.5 14.5t-14.5 35.5v800q0 21 14.5 35.5t35.5 14.5zM650 1000h200q21 0 35.5 -14.5t14.5 -35.5v-800q0 -21 -14.5 -35.5t-35.5 -14.5h-200q-21 0 -35.5 14.5t-14.5 35.5v800 q0 21 14.5 35.5t35.5 14.5z",
    "stop": "M1100 950v-800q0 -21 -14.5 -35.5t-35.5 -14.5h-800q-21 0 -35.5 14.5t-14.5 35.5v800q0 21 14.5 35.5t35.5 14.5h800q21 0 35.5 -14.5t14.5 -35.5z",
    "forward": "M500 612v438q0 21 10.5 25t25.5 -10l492 -480q15 -14 15 -35t-15 -35l-492 -480q-15 -14 -25.5 -10t-10.5 25v438l-464 -453q-15 -14 -25.5 -10t-10.5 25v1000q0 21 10.5 25t25.5 -10z",
    "fast-forward": "M1048 1102l100 1q20 0 35 -14.5t15 -35.5l5 -1000q0 -21 -14.5 -35.5t-35.5 -14.5l-100 -1q-21 0 -35.5 14.5t-14.5 35.5l-2 437l-463 -454q-14 -15 -24.5 -10.5t-10.5 25.5l-2 437l-462 -455q-15 -14 -25.5 -9.5t-10.5 24.5l-5 1000q0 21 10.5 25.5t25.5 -10.5l466 -450 l-2 438q0 20 10.5 24.5t25.5 -9.5l466 -451l-2 438q0 21 14.5 35.5t35.5 14.5z",
    "step-forward": "M850 1100h100q21 0 35.5 -14.5t14.5 -35.5v-1000q0 -21 -14.5 -35.5t-35.5 -14.5h-100q-21 0 -35.5 14.5t-14.5 35.5v438l-464 -453q-15 -14 -25.5 -10t-10.5 25v1000q0 21 10.5 25t25.5 -10l464 -453v438q0 21 14.5 35.5t35.5 14.5z",
    "eject": "M686 1081l501 -540q15 -15 10.5 -26t-26.5 -11h-1042q-22 0 -26.5 11t10.5 26l501 540q15 15 36 15t36 -15zM150 400h1000q21 0 35.5 -14.5t14.5 -35.5v-100q0 -21 -14.5 -35.5t-35.5 -14.5h-1000q-21 0 -35.5 14.5t-14.5 35.5v100q0 21 14.5 35.5t35.5 14.5z",
    "key": "M250 1200h600q21 0 35.5 -14.5t14.5 -35.5v-400q0 -21 -14.5 -35.5t-35.5 -14.5h-150v-500l-255 -178q-19 -9 -32 -1t-13 29v650h-150q-21 0 -35.5 14.5t-14.5 35.5v400q0 21 14.5 35.5t35.5 14.5zM400 1100v-100h300v100h-300z",
    "exit": "M250 1200h750q39 0 69.5 -40.5t30.5 -84.5v-933l-700 -117v950l600 125h-700v-1000h-100v1025q0 23 15.5 49t34.5 26zM500 525v-100l100 20v100z",
    "plus-sign": "M600 1177q117 0 224 -45.5t184.5 -123t123 -184.5t45.5 -224t-45.5 -224t-123 -184.5t-184.5 -123t-224 -45.5t-224 45.5t-184.5 123t-123 184.5t-45.5 224t45.5 224t123 184.5t184.5 123t224 45.5zM650 900h-100q-21 0 -35.5 -14.5t-14.5 -35.5v-150h-150 q-21 0 -35.5 -14.5t-14.5 -35.5v-100q0 -21 14.5 -35.5t35.5 -14.5h150v-150q0 -21 14.5 -35.5t35.5 -14.5h100q21 0 35.5 14.5t14.5 35.5v150h150q21 0 35.5 14.5t14.5 35.5v100q0 21 -14.5 35.5t-35.5 14.5h-150v150q0 21 -14.5 35.5t-35.5 14.5z",
    "minus-sign": "M600 1177q117 0 224 -45.5t184.5 -123t123 -184.5t45.5 -224t-45.5 -224t-123 -184.5t-184.5 -123t-224 -45.5t-224 45.5t-184.5 123t-123 184.5t-45.5 224t45.5 224t123 184.5t184.5 123t224 45.5zM850 700h-500q-21 0 -35.5 -14.5t-14.5 -35.5v-100q0 -21 14.5 -35.5 t35.5 -14.5h500q21 0 35.5 14.5t14.5 35.5v100q0 21 -14.5 35.5t-35.5 14.5z",
    "remove-sign": "M600 1177q117 0 224 -45.5t184.5 -123t123 -184.5t45.5 -224t-45.5 -224t-123 -184.5t-184.5 -123t-224 -45.5t-224 45.5t-184.5 123t-123 184.5t-45.5 224t45.5 224t123 184.5t184.5 123t224 45.5zM741.5 913q-12.5 0 -21.5 -9l-120 -120l-120 120q-9 9 -21.5 9 t-21.5 -9l-141 -141q-9 -9 -9 -21.5t9 -21.5l120 -120l-120 -120q-9 -9 -9 -21.5t9 -21.5l141 -141q9 -9 21.5 -9t21.5 9l120 120l120 -120q9 -9 21.5 -9t21.5 9l141 141q9 9 9 21.5t-9 21.5l-120 120l120 120q9 9 9 21.5t-9 21.5l-141 141q-9 9 -21.5 9z",
    "ok-sign": "M600 1177q117 0 224 -45.5t184.5 -123t123 -184.5t45.5 -224t-45.5 -224t-123 -184.5t-184.5 -123t-224 -45.5t-224 45.5t-184.5 123t-123 184.5t-45.5 224t45.5 224t123 184.5t184.5 123t224 45.5zM546 623l-84 85q-7 7 -17.5 7t-18.5 -7l-139 -139q-7 -8 -7 -18t7 -18 l242 -241q7 -8 17.5 -8t17.5 8l375 375q7 7 7 17.5t-7 18.5l-139 139q-7 7 -17.5 7t-17.5 -7z",
    "question-sign": "M600 1177q117 0 224 -45.5t184.5 -123t123 -184.5t45.5 -224t-45.5 -224t-123 -184.5t-184.5 -123t-224 -45.5t-224 45.5t-184.5 123t-123 184.5t-45.5 224t45.5 224t123 184.5t184.5 123t224 45.5zM588 941q-29 0 -59 -5.5t-63 -20.5t-58 -38.5t-41.5 -63t-16.5 -89.5 q0 -25 20 -25h131q30 -5 35 11q6 20 20.5 28t45.5 8q20 0 31.5 -10.5t11.5 -28.5q0 -23 -7 -34t-26 -18q-1 0 -13.5 -4t-19.5 -7.5t-20 -10.5t-22 -17t-18.5 -24t-15.5 -35t-8 -46q-1 -8 5.5 -16.5t20.5 -8.5h173q7 0 22 8t35 28t37.5 48t29.5 74t12 100q0 47 -17 83 t-42.5 57t-59.5 34.5t-64 18t-59 4.5zM675 400h-150q-10 0 -17.5 -7.5t-7.5 -17.5v-150q0 -10 7.5 -17.5t17.5 -7.5h150q10 0 17.5 7.5t7.5 17.5v150q0 10 -7.5 17.5t-17.5 7.5z",
    "info-sign": "M600 1177q117 0 224 -45.5t184.5 -123t123 -184.5t45.5 -224t-45.5 -224t-123 -184.5t-184.5 -123t-224 -45.5t-224 45.5t-184.5 123t-123 184.5t-45.5 224t45.5 224t123 184.5t184.5 123t224 45.5zM675 1000h-150q-10 0 -17.5 -7.5t-7.5 -17.5v-150q0 -10 7.5 -17.5 t17.5 -7.5h150q10 0 17.5 7.5t7.5 17.5v150q0 10 -7.5 17.5t-17.5 7.5zM675 700h-250q-10 0 -17.5 -7.5t-7.5 -17.5v-50q0 -10 7.5 -17.5t17.5 -7.5h75v-200h-75q-10 0 -17.5 -7.5t-7.5 -17.5v-50q0 -10 7.5 -17.5t17.5 -7.5h350q10 0 17.5 7.5t7.5 17.5v50q0 10 -7.5 17.5 t-17.5 7.5h-75v275q0 10 -7.5 17.5t-17.5 7.5z",
    "screenshot": "M525 1200h150q10 0 17.5 -7.5t7.5 -17.5v-194q103 -27 178.5 -102.5t102.5 -178.5h194q10 0 17.5 -7.5t7.5 -17.5v-150q0 -10 -7.5 -17.5t-17.5 -7.5h-194q-27 -103 -102.5 -178.5t-178.5 -102.5v-194q0 -10 -7.5 -17.5t-17.5 -7.5h-150q-10 0 -17.5 7.5t-7.5 17.5v194 q-103 27 -178.5 102.5t-102.5 178.5h-194q-10 0 -17.5 7.5t-7.5 17.5v150q0 10 7.5 17.5t17.5 7.5h194q27 103 102.5 178.5t178.5 102.5v194q0 10 7.5 17.5t17.5 7.5zM700 893v-168q0 -10 -7.5 -17.5t-17.5 -7.5h-150q-10 0 -17.5 7.5t-7.5 17.5v168q-68 -23 -119 -74 t-74 -119h168q10 0 17.5 -7.5t7.5 -17.5v-150q0 -10 -7.5 -17.5t-17.5 -7.5h-168q23 -68 74 -119t119 -74v168q0 10 7.5 17.5t17.5 7.5h150q10 0 17.5 -7.5t7.5 -17.5v-168q68 23 119 74t74 119h-168q-10 0 -17.5 7.5t-7.5 17.5v150q0 10 7.5 17.5t17.5 7.5h168 q-23 68 -74 119t-119 74z",
    "remove-circle": "M600 1177q117 0 224 -45.5t184.5 -123t123 -184.5t45.5 -224t-45.5 -224t-123 -184.5t-184.5 -123t-224 -45.5t-224 45.5t-184.5 123t-123 184.5t-45.5 224t45.5 224t123 184.5t184.5 123t224 45.5zM600 1027q-116 0 -214.5 -57t-155.5 -155.5t-57 -214.5t57 -214.5 t155.5 -155.5t214.5 -57t214.5 57t155.5 155.5t57 214.5t-57 214.5t-155.5 155.5t-214.5 57zM759 823l64 -64q7 -7 7 -17.5t-7 -17.5l-124 -124l124 -124q7 -7 7 -17.5t-7 -17.5l-64 -64q-7 -7 -17.5 -7t-17.5 7l-124 124l-124 -124q-7 -7 -17.5 -7t-17.5 7l-64 64 q-7 7 -7 17.5t7 17.5l124 124l-124 124q-7 7 -7 17.5t7 17.5l64 64q7 7 17.5 7t17.5 -7l124 -124l124 124q7 7 17.5 7t17.5 -7z",
    "ok-circle": "M600 1177q117 0 224 -45.5t184.5 -123t123 -184.5t45.5 -224t-45.5 -224t-123 -184.5t-184.5 -123t-224 -45.5t-224 45.5t-184.5 123t-123 184.5t-45.5 224t45.5 224t123 184.5t184.5 123t224 45.5zM600 1027q-116 0 -214.5 -57t-155.5 -155.5t-57 -214.5t57 -214.5 t155.5 -155.5t214.5 -57t214.5 57t155.5 155.5t57 214.5t-57 214.5t-155.5 155.5t-214.5 57zM782 788l106 -106q7 -7 7 -17.5t-7 -17.5l-320 -321q-8 -7 -18 -7t-18 7l-202 203q-8 7 -8 17.5t8 17.5l106 106q7 8 17.5 8t17.5 -8l79 -79l197 197q7 7 17.5 7t17.5 -7z",
    "ban-circle": "M600 1177q117 0 224 -45.5t184.5 -123t123 -184.5t45.5 -224t-45.5 -224t-123 -184.5t-184.5 -123t-224 -45.5t-224 45.5t-184.5 123t-123 184.5t-45.5 224t45.5 224t123 184.5t184.5 123t224 45.5zM600 1027q-116 0 -214.5 -57t-155.5 -155.5t-57 -214.5q0 -120 65 -225 l587 587q-105 65 -225 65zM965 819l-584 -584q104 -62 219 -62q116 0 214.5 57t155.5 155.5t57 214.5q0 115 -62 219z",
    "arrow-left": "M39 582l522 427q16 13 27.5 8t11.5 -26v-291h550q21 0 35.5 -14.5t14.5 -35.5v-200q0 -21 -14.5 -35.5t-35.5 -14.5h-550v-291q0 -21 -11.5 -26t-27.5 8l-522 427q-16 13 -16 32t16 32z",
    "arrow-right": "M639 1009l522 -427q16 -13 16 -32t-16 -32l-522 -427q-16 -13 -27.5 -8t-11.5 26v291h-550q-21 0 -35.5 14.5t-14.5 35.5v200q0 21 14.5 35.5t35.5 14.5h550v291q0 21 11.5 26t27.5 -8z",
    "arrow-up": "M682 1161l427 -522q13 -16 8 -27.5t-26 -11.5h-291v-550q0 -21 -14.5 -35.5t-35.5 -14.5h-200q-21 0 -35.5 14.5t-14.5 35.5v550h-291q-21 0 -26 11.5t8 27.5l427 522q13 16 32 16t32 -16z",
    "arrow-down": "M550 1200h200q21 0 35.5 -14.5t14.5 -35.5v-550h291q21 0 26 -11.5t-8 -27.5l-427 -522q-13 -16 -32 -16t-32 16l-427 522q-13 16 -8 27.5t26 11.5h291v550q0 21 14.5 35.5t35.5 14.5z",
    "share-alt": "M639 1109l522 -427q16 -13 16 -32t-16 -32l-522 -427q-16 -13 -27.5 -8t-11.5 26v291q-94 -2 -182 -20t-170.5 -52t-147 -92.5t-100.5 -135.5q5 105 27 193.5t67.5 167t113 135t167 91.5t225.5 42v262q0 21 11.5 26t27.5 -8z",
    "resize-full": "M850 1200h300q21 0 35.5 -14.5t14.5 -35.5v-300q0 -21 -10.5 -25t-24.5 10l-94 94l-249 -249q-8 -7 -18 -7t-18 7l-106 106q-7 8 -7 18t7 18l249 249l-94 94q-14 14 -10 24.5t25 10.5zM350 0h-300q-21 0 -35.5 14.5t-14.5 35.5v300q0 21 10.5 25t24.5 -10l94 -94l249 249 q8 7 18 7t18 -7l106 -106q7 -8 7 -18t-7 -18l-249 -249l94 -94q14 -14 10 -24.5t-25 -10.5z",
    "resize-small": "M1014 1120l106 -106q7 -8 7 -18t-7 -18l-249 -249l94 -94q14 -14 10 -24.5t-25 -10.5h-300q-21 0 -35.5 14.5t-14.5 35.5v300q0 21 10.5 25t24.5 -10l94 -94l249 249q8 7 18 7t18 -7zM250 600h300q21 0 35.5 -14.5t14.5 -35.5v-300q0 -21 -10.5 -25t-24.5 10l-94 94 l-249 -249q-8 -7 -18 -7t-18 7l-106 106q-7 8 -7 18t7 18l249 249l-94 94q-14 14 -10 24.5t25 10.5z",
    "exclamation-sign": "M600 1177q117 0 224 -45.5t184.5 -123t123 -184.5t45.5 -224t-45.5 -224t-123 -184.5t-184.5 -123t-224 -45.5t-224 45.5t-184.5 123t-123 184.5t-45.5 224t45.5 224t123 184.5t184.5 123t224 45.5zM704 900h-208q-20 0 -32 -14.5t-8 -34.5l58 -302q4 -20 21.5 -34.5 t37.5 -14.5h54q20 0 37.5 14.5t21.5 34.5l58 302q4 20 -8 34.5t-32 14.5zM675 400h-150q-10 0 -17.5 -7.5t-7.5 -17.5v-150q0 -10 7.5 -17.5t17.5 -7.5h150q10 0 17.5 7.5t7.5 17.5v150q0 10 -7.5 17.5t-17.5 7.5z",
    "fire": "M653 1231q-39 -67 -54.5 -131t-10.5 -114.5t24.5 -96.5t47.5 -80t63.5 -62.5t68.5 -46.5t65 -30q-4 7 -17.5 35t-18.5 39.5t-17 39.5t-17 43t-13 42t-9.5 44.5t-2 42t4 43t13.5 39t23 38.5q96 -42 165 -107.5t105 -138t52 -156t13 -159t-19 -149.5q-13 -55 -44 -106.5 t-68 -87t-78.5 -64.5t-72.5 -45t-53 -22q-72 -22 -127 -11q-31 6 -13 19q6 3 17 7q13 5 32.5 21t41 44t38.5 63.5t21.5 81.5t-6.5 94.5t-50 107t-104 115.5q10 -104 -0.5 -189t-37 -140.5t-65 -93t-84 -52t-93.5 -11t-95 24.5q-80 36 -131.5 114t-53.5 171q-2 23 0 49.5 t4.5 52.5t13.5 56t27.5 60t46 64.5t69.5 68.5q-8 -53 -5 -102.5t17.5 -90t34 -68.5t44.5 -39t49 -2q31 13 38.5 36t-4.5 55t-29 64.5t-36 75t-26 75.5q-15 85 2 161.5t53.5 128.5t85.5 92.5t93.5 61t81.5 25.5z",
    "eye-open": "M600 1094q82 0 160.5 -22.5t140 -59t116.5 -82.5t94.5 -95t68 -95t42.5 -82.5t14 -57.5t-14 -57.5t-43 -82.5t-68.5 -95t-94.5 -95t-116.5 -82.5t-140 -59t-159.5 -22.5t-159.5 22.5t-140 59t-116.5 82.5t-94.5 95t-68.5 95t-43 82.5t-14 57.5t14 57.5t42.5 82.5t68 95 t94.5 95t116.5 82.5t140 59t160.5 22.5zM888 829q-15 15 -18 12t5 -22q25 -57 25 -119q0 -124 -88 -212t-212 -88t-212 88t-88 212q0 59 23 114q8 19 4.5 22t-17.5 -12q-70 -69 -160 -184q-13 -16 -15 -40.5t9 -42.5q22 -36 47 -71t70 -82t92.5 -81t113 -58.5t133.5 -24.5 t133.5 24t113 58.5t92.5 81.5t70 81.5t47 70.5q11 18 9 42.5t-14 41.5q-90 117 -163 189zM448 727l-35 -36q-15 -15 -19.5 -38.5t4.5 -41.5q37 -68 93 -116q16 -13 38.5 -11t36.5 17l35 34q14 15 12.5 33.5t-16.5 33.5q-44 44 -89 117q-11 18 -28 20t-32 -12z",
    "eye-close": "M592 0h-148l31 120q-91 20 -175.5 68.5t-143.5 106.5t-103.5 119t-66.5 110t-22 76q0 21 14 57.5t42.5 82.5t68 95t94.5 95t116.5 82.5t140 59t160.5 22.5q61 0 126 -15l32 121h148zM944 770l47 181q108 -85 176.5 -192t68.5 -159q0 -26 -19.5 -71t-59.5 -102t-93 -112 t-129 -104.5t-158 -75.5l46 173q77 49 136 117t97 131q11 18 9 42.5t-14 41.5q-54 70 -107 130zM310 824q-70 -69 -160 -184q-13 -16 -15 -40.5t9 -42.5q18 -30 39 -60t57 -70.5t74 -73t90 -61t105 -41.5l41 154q-107 18 -178.5 101.5t-71.5 193.5q0 59 23 114q8 19 4.5 22 t-17.5 -12zM448 727l-35 -36q-15 -15 -19.5 -38.5t4.5 -41.5q37 -68 93 -116q16 -13 38.5 -11t36.5 17l12 11l22 86l-3 4q-44 44 -89 117q-11 18 -28 20t-32 -12z",
    "warning-sign": "M-90 100l642 1066q20 31 48 28.5t48 -35.5l642 -1056q21 -32 7.5 -67.5t-50.5 -35.5h-1294q-37 0 -50.5 34t7.5 66zM155 200h345v75q0 10 7.5 17.5t17.5 7.5h150q10 0 17.5 -7.5t7.5 -17.5v-75h345l-445 723zM496 700h208q20 0 32 -14.5t8 -34.5l-58 -252 q-4 -20 -21.5 -34.5t-37.5 -14.5h-54q-20 0 -37.5 14.5t-21.5 34.5l-58 252q-4 20 8 34.5t32 14.5z",
    "shopping-cart": "M56 1200h94q17 0 31 -11t18 -27l38 -162h896q24 0 39 -18.5t10 -42.5l-100 -475q-5 -21 -27 -42.5t-55 -21.5h-633l48 -200h535q21 0 35.5 -14.5t14.5 -35.5t-14.5 -35.5t-35.5 -14.5h-50v-50q0 -21 -14.5 -35.5t-35.5 -14.5t-35.5 14.5t-14.5 35.5v50h-300v-50 q0 -21 -14.5 -35.5t-35.5 -14.5t-35.5 14.5t-14.5 35.5v50h-31q-18 0 -32.5 10t-20.5 19l-5 10l-201 961h-54q-20 0 -35 14.5t-15 35.5t15 35.5t35 14.5z",
    "folder-close": "M1200 1000v-100h-1200v100h200q0 41 29.5 70.5t70.5 29.5h300q41 0 70.5 -29.5t29.5 -70.5h500zM0 800h1200v-800h-1200v800z",
    "folder-open": "M200 800l-200 -400v600h200q0 41 29.5 70.5t70.5 29.5h300q42 0 71 -29.5t29 -70.5h500v-200h-1000zM1500 700l-300 -700h-1200l300 700h1200z",
    "resize-vertical": "M635 1184l230 -249q14 -14 10 -24.5t-25 -10.5h-150v-601h150q21 0 25 -10.5t-10 -24.5l-230 -249q-14 -15 -35 -15t-35 15l-230 249q-14 14 -10 24.5t25 10.5h150v601h-150q-21 0 -25 10.5t10 24.5l230 249q14 15 35 15t35 -15z",
    "resize-horizontal": "M936 864l249 -229q14 -15 14 -35.5t-14 -35.5l-249 -229q-15 -15 -25.5 -10.5t-10.5 24.5v151h-600v-151q0 -20 -10.5 -24.5t-25.5 10.5l-249 229q-14 15 -14 35.5t14 35.5l249 229q15 15 25.5 10.5t10.5 -25.5v-149h600v149q0 21 10.5 25.5t25.5 -10.5z",
    "hdd": "M1169 400l-172 732q-5 23 -23 45.5t-38 22.5h-672q-20 0 -38 -20t-23 -41l-172 -739h1138zM1100 300h-1000q-41 0 -70.5 -29.5t-29.5 -70.5v-100q0 -41 29.5 -70.5t70.5 -29.5h1000q41 0 70.5 29.5t29.5 70.5v100q0 41 -29.5 70.5t-70.5 29.5zM800 100v100h100v-100h-100 zM1000 100v100h100v-100h-100z",
    "bell": "M553 1200h94q20 0 29 -10.5t3 -29.5l-18 -37q83 -19 144 -82.5t76 -140.5l63 -327l118 -173h17q19 0 33 -14.5t14 -35t-13 -40.5t-31 -27q-8 -4 -23 -9.5t-65 -19.5t-103 -25t-132.5 -20t-158.5 -9q-57 0 -115 5t-104 12t-88.5 15.5t-73.5 17.5t-54.5 16t-35.5 12l-11 4 q-18 8 -31 28t-13 40.5t14 35t33 14.5h17l118 173l63 327q15 77 76 140t144 83l-18 32q-6 19 3.5 32t28.5 13zM498 110q50 -6 102 -6q53 0 102 6q-12 -49 -39.5 -79.5t-62.5 -30.5t-63 30.5t-39 79.5z",
    "certificate": "M800 946l224 78l-78 -224l234 -45l-180 -155l180 -155l-234 -45l78 -224l-224 78l-45 -234l-155 180l-155 -180l-45 234l-224 -78l78 224l-234 45l180 155l-180 155l234 45l-78 224l224 -78l45 234l155 -180l155 180z",
    "thumbs-up": "M650 1200h50q40 0 70 -40.5t30 -84.5v-150l-28 -125h328q40 0 70 -40.5t30 -84.5v-100q0 -45 -29 -74l-238 -344q-16 -24 -38 -40.5t-45 -16.5h-250q-7 0 -42 25t-66 50l-31 25h-61q-45 0 -72.5 18t-27.5 57v400q0 36 20 63l145 196l96 198q13 28 37.5 48t51.5 20z M650 1100l-100 -212l-150 -213v-375h100l136 -100h214l250 375v125h-450l50 225v175h-50zM50 800h100q21 0 35.5 -14.5t14.5 -35.5v-500q0 -21 -14.5 -35.5t-35.5 -14.5h-100q-21 0 -35.5 14.5t-14.5 35.5v500q0 21 14.5 35.5t35.5 14.5z",
    "thumbs-down": "M600 1100h250q23 0 45 -16.5t38 -40.5l238 -344q29 -29 29 -74v-100q0 -44 -30 -84.5t-70 -40.5h-328q28 -118 28 -125v-150q0 -44 -30 -84.5t-70 -40.5h-50q-27 0 -51.5 20t-37.5 48l-96 198l-145 196q-20 27 -20 63v400q0 39 27.5 57t72.5 18h61q124 100 139 100z M50 1000h100q21 0 35.5 -14.5t14.5 -35.5v-500q0 -21 -14.5 -35.5t-35.5 -14.5h-100q-21 0 -35.5 14.5t-14.5 35.5v500q0 21 14.5 35.5t35.5 14.5zM636 1000l-136 -100h-100v-375l150 -213l100 -212h50v175l-50 225h450v125l-250 375h-214z",
    "hand-right": "M356 873l363 230q31 16 53 -6l110 -112q13 -13 13.5 -32t-11.5 -34l-84 -121h302q84 0 138 -38t54 -110t-55 -111t-139 -39h-106l-131 -339q-6 -21 -19.5 -41t-28.5 -20h-342q-7 0 -90 81t-83 94v525q0 17 14 35.5t28 28.5zM400 792v-503l100 -89h293l131 339 q6 21 19.5 41t28.5 20h203q21 0 30.5 25t0.5 50t-31 25h-456h-7h-6h-5.5t-6 0.5t-5 1.5t-5 2t-4 2.5t-4 4t-2.5 4.5q-12 25 5 47l146 183l-86 83zM50 800h100q21 0 35.5 -14.5t14.5 -35.5v-500q0 -21 -14.5 -35.5t-35.5 -14.5h-100q-21 0 -35.5 14.5t-14.5 35.5v500 q0 21 14.5 35.5t35.5 14.5z",
    "hand-left": "M475 1103l366 -230q2 -1 6 -3.5t14 -10.5t18 -16.5t14.5 -20t6.5 -22.5v-525q0 -13 -86 -94t-93 -81h-342q-15 0 -28.5 20t-19.5 41l-131 339h-106q-85 0 -139.5 39t-54.5 111t54 110t138 38h302l-85 121q-11 15 -10.5 34t13.5 32l110 112q22 22 53 6zM370 945l146 -183 q17 -22 5 -47q-2 -2 -3.5 -4.5t-4 -4t-4 -2.5t-5 -2t-5 -1.5t-6 -0.5h-6h-6.5h-6h-475v-100h221q15 0 29 -20t20 -41l130 -339h294l106 89v503l-342 236zM1050 800h100q21 0 35.5 -14.5t14.5 -35.5v-500q0 -21 -14.5 -35.5t-35.5 -14.5h-100q-21 0 -35.5 14.5t-14.5 35.5 v500q0 21 14.5 35.5t35.5 14.5z",
    "hand-up": "M550 1294q72 0 111 -55t39 -139v-106l339 -131q21 -6 41 -19.5t20 -28.5v-342q0 -7 -81 -90t-94 -83h-525q-17 0 -35.5 14t-28.5 28l-9 14l-230 363q-16 31 6 53l112 110q13 13 32 13.5t34 -11.5l121 -84v302q0 84 38 138t110 54zM600 972v203q0 21 -25 30.5t-50 0.5 t-25 -31v-456v-7v-6v-5.5t-0.5 -6t-1.5 -5t-2 -5t-2.5 -4t-4 -4t-4.5 -2.5q-25 -12 -47 5l-183 146l-83 -86l236 -339h503l89 100v293l-339 131q-21 6 -41 19.5t-20 28.5zM450 200h500q21 0 35.5 -14.5t14.5 -35.5v-100q0 -21 -14.5 -35.5t-35.5 -14.5h-500 q-21 0 -35.5 14.5t-14.5 35.5v100q0 21 14.5 35.5t35.5 14.5z",
    "hand-down": "M350 1100h500q21 0 35.5 14.5t14.5 35.5v100q0 21 -14.5 35.5t-35.5 14.5h-500q-21 0 -35.5 -14.5t-14.5 -35.5v-100q0 -21 14.5 -35.5t35.5 -14.5zM600 306v-106q0 -84 -39 -139t-111 -55t-110 54t-38 138v302l-121 -84q-15 -12 -34 -11.5t-32 13.5l-112 110 q-22 22 -6 53l230 363q1 2 3.5 6t10.5 13.5t16.5 17t20 13.5t22.5 6h525q13 0 94 -83t81 -90v-342q0 -15 -20 -28.5t-41 -19.5zM308 900l-236 -339l83 -86l183 146q22 17 47 5q2 -1 4.5 -2.5t4 -4t2.5 -4t2 -5t1.5 -5t0.5 -6v-5.5v-6v-7v-456q0 -22 25 -31t50 0.5t25 30.5 v203q0 15 20 28.5t41 19.5l339 131v293l-89 100h-503z",
    "circle-arrow-right": "M600 1178q118 0 225 -45.5t184.5 -123t123 -184.5t45.5 -225t-45.5 -225t-123 -184.5t-184.5 -123t-225 -45.5t-225 45.5t-184.5 123t-123 184.5t-45.5 225t45.5 225t123 184.5t184.5 123t225 45.5zM914 632l-275 223q-16 13 -27.5 8t-11.5 -26v-137h-275 q-10 0 -17.5 -7.5t-7.5 -17.5v-150q0 -10 7.5 -17.5t17.5 -7.5h275v-137q0 -21 11.5 -26t27.5 8l275 223q16 13 16 32t-16 32z",
    "circle-arrow-left": "M600 1178q118 0 225 -45.5t184.5 -123t123 -184.5t45.5 -225t-45.5 -225t-123 -184.5t-184.5 -123t-225 -45.5t-225 45.5t-184.5 123t-123 184.5t-45.5 225t45.5 225t123 184.5t184.5 123t225 45.5zM561 855l-275 -223q-16 -13 -16 -32t16 -32l275 -223q16 -13 27.5 -8 t11.5 26v137h275q10 0 17.5 7.5t7.5 17.5v150q0 10 -7.5 17.5t-17.5 7.5h-275v137q0 21 -11.5 26t-27.5 -8z",
    "circle-arrow-up": "M600 1178q118 0 225 -45.5t184.5 -123t123 -184.5t45.5 -225t-45.5 -225t-123 -184.5t-184.5 -123t-225 -45.5t-225 45.5t-184.5 123t-123 184.5t-45.5 225t45.5 225t123 184.5t184.5 123t225 45.5zM855 639l-223 275q-13 16 -32 16t-32 -16l-223 -275q-13 -16 -8 -27.5 t26 -11.5h137v-275q0 -10 7.5 -17.5t17.5 -7.5h150q10 0 17.5 7.5t7.5 17.5v275h137q21 0 26 11.5t-8 27.5z",
    "circle-arrow-down": "M600 1178q118 0 225 -45.5t184.5 -123t123 -184.5t45.5 -225t-45.5 -225t-123 -184.5t-184.5 -123t-225 -45.5t-225 45.5t-184.5 123t-123 184.5t-45.5 225t45.5 225t123 184.5t184.5 123t225 45.5zM675 900h-150q-10 0 -17.5 -7.5t-7.5 -17.5v-275h-137q-21 0 -26 -11.5 t8 -27.5l223 -275q13 -16 32 -16t32 16l223 275q13 16 8 27.5t-26 11.5h-137v275q0 10 -7.5 17.5t-17.5 7.5z",
    "globe": "M600 1176q116 0 222.5 -46t184 -123.5t123.5 -184t46 -222.5t-46 -222.5t-123.5 -184t-184 -123.5t-222.5 -46t-222.5 46t-184 123.5t-123.5 184t-46 222.5t46 222.5t123.5 184t184 123.5t222.5 46zM627 1101q-15 -12 -36.5 -20.5t-35.5 -12t-43 -8t-39 -6.5 q-15 -3 -45.5 0t-45.5 -2q-20 -7 -51.5 -26.5t-34.5 -34.5q-3 -11 6.5 -22.5t8.5 -18.5q-3 -34 -27.5 -91t-29.5 -79q-9 -34 5 -93t8 -87q0 -9 17 -44.5t16 -59.5q12 0 23 -5t23.5 -15t19.5 -14q16 -8 33 -15t40.5 -15t34.5 -12q21 -9 52.5 -32t60 -38t57.5 -11 q7 -15 -3 -34t-22.5 -40t-9.5 -38q13 -21 23 -34.5t27.5 -27.5t36.5 -18q0 -7 -3.5 -16t-3.5 -14t5 -17q104 -2 221 112q30 29 46.5 47t34.5 49t21 63q-13 8 -37 8.5t-36 7.5q-15 7 -49.5 15t-51.5 19q-18 0 -41 -0.5t-43 -1.5t-42 -6.5t-38 -16.5q-51 -35 -66 -12 q-4 1 -3.5 25.5t0.5 25.5q-6 13 -26.5 17.5t-24.5 6.5q1 15 -0.5 30.5t-7 28t-18.5 11.5t-31 -21q-23 -25 -42 4q-19 28 -8 58q6 16 22 22q6 -1 26 -1.5t33.5 -4t19.5 -13.5q7 -12 18 -24t21.5 -20.5t20 -15t15.5 -10.5l5 -3q2 12 7.5 30.5t8 34.5t-0.5 32q-3 18 3.5 29 t18 22.5t15.5 24.5q6 14 10.5 35t8 31t15.5 22.5t34 22.5q-6 18 10 36q8 0 24 -1.5t24.5 -1.5t20 4.5t20.5 15.5q-10 23 -31 42.5t-37.5 29.5t-49 27t-43.5 23q0 1 2 8t3 11.5t1.5 10.5t-1 9.5t-4.5 4.5q31 -13 58.5 -14.5t38.5 2.5l12 5q5 28 -9.5 46t-36.5 24t-50 15 t-41 20q-18 -4 -37 0zM613 994q0 -17 8 -42t17 -45t9 -23q-8 1 -39.5 5.5t-52.5 10t-37 16.5q3 11 16 29.5t16 25.5q10 -10 19 -10t14 6t13.5 14.5t16.5 12.5z",
    "wrench": "M756 1157q164 92 306 -9l-259 -138l145 -232l251 126q6 -89 -34 -156.5t-117 -110.5q-60 -34 -127 -39.5t-126 16.5l-596 -596q-15 -16 -36.5 -16t-36.5 16l-111 110q-15 15 -15 36.5t15 37.5l600 599q-34 101 5.5 201.5t135.5 154.5z",
    "tasks": "M100 1196h1000q41 0 70.5 -29.5t29.5 -70.5v-100q0 -41 -29.5 -70.5t-70.5 -29.5h-1000q-41 0 -70.5 29.5t-29.5 70.5v100q0 41 29.5 70.5t70.5 29.5zM1100 1096h-200v-100h200v100zM100 796h1000q41 0 70.5 -29.5t29.5 -70.5v-100q0 -41 -29.5 -70.5t-70.5 -29.5h-1000 q-41 0 -70.5 29.5t-29.5 70.5v100q0 41 29.5 70.5t70.5 29.5zM1100 696h-500v-100h500v100zM100 396h1000q41 0 70.5 -29.5t29.5 -70.5v-100q0 -41 -29.5 -70.5t-70.5 -29.5h-1000q-41 0 -70.5 29.5t-29.5 70.5v100q0 41 29.5 70.5t70.5 29.5zM1100 296h-300v-100h300v100z ",
    "filter": "M150 1200h900q21 0 35.5 -14.5t14.5 -35.5t-14.5 -35.5t-35.5 -14.5h-900q-21 0 -35.5 14.5t-14.5 35.5t14.5 35.5t35.5 14.5zM700 500v-300l-200 -200v500l-350 500h900z",
    "fullscreen": "M50 1200h300q21 0 25 -10.5t-10 -24.5l-94 -94l199 -199q7 -8 7 -18t-7 -18l-106 -106q-8 -7 -18 -7t-18 7l-199 199l-94 -94q-14 -14 -24.5 -10t-10.5 25v300q0 21 14.5 35.5t35.5 14.5zM850 1200h300q21 0 35.5 -14.5t14.5 -35.5v-300q0 -21 -10.5 -25t-24.5 10l-94 94 l-199 -199q-8 -7 -18 -7t-18 7l-106 106q-7 8 -7 18t7 18l199 199l-94 94q-14 14 -10 24.5t25 10.5zM364 470l106 -106q7 -8 7 -18t-7 -18l-199 -199l94 -94q14 -14 10 -24.5t-25 -10.5h-300q-21 0 -35.5 14.5t-14.5 35.5v300q0 21 10.5 25t24.5 -10l94 -94l199 199 q8 7 18 7t18 -7zM1071 271l94 94q14 14 24.5 10t10.5 -25v-300q0 -21 -14.5 -35.5t-35.5 -14.5h-300q-21 0 -25 10.5t10 24.5l94 94l-199 199q-7 8 -7 18t7 18l106 106q8 7 18 7t18 -7z",
    "dashboard": "M596 1192q121 0 231.5 -47.5t190 -127t127 -190t47.5 -231.5t-47.5 -231.5t-127 -190.5t-190 -127t-231.5 -47t-231.5 47t-190.5 127t-127 190.5t-47 231.5t47 231.5t127 190t190.5 127t231.5 47.5zM596 1010q-112 0 -207.5 -55.5t-151 -151t-55.5 -207.5t55.5 -207.5 t151 -151t207.5 -55.5t207.5 55.5t151 151t55.5 207.5t-55.5 207.5t-151 151t-207.5 55.5zM454.5 905q22.5 0 38.5 -16t16 -38.5t-16 -39t-38.5 -16.5t-38.5 16.5t-16 39t16 38.5t38.5 16zM754.5 905q22.5 0 38.5 -16t16 -38.5t-16 -39t-38 -16.5q-14 0 -29 10l-55 -145 q17 -23 17 -51q0 -36 -25.5 -61.5t-61.5 -25.5t-61.5 25.5t-25.5 61.5q0 32 20.5 56.5t51.5 29.5l122 126l1 1q-9 14 -9 28q0 23 16 39t38.5 16zM345.5 709q22.5 0 38.5 -16t16 -38.5t-16 -38.5t-38.5 -16t-38.5 16t-16 38.5t16 38.5t38.5 16zM854.5 709q22.5 0 38.5 -16 t16 -38.5t-16 -38.5t-38.5 -16t-38.5 16t-16 38.5t16 38.5t38.5 16z",
    "paperclip": "M546 173l469 470q91 91 99 192q7 98 -52 175.5t-154 94.5q-22 4 -47 4q-34 0 -66.5 -10t-56.5 -23t-55.5 -38t-48 -41.5t-48.5 -47.5q-376 -375 -391 -390q-30 -27 -45 -41.5t-37.5 -41t-32 -46.5t-16 -47.5t-1.5 -56.5q9 -62 53.5 -95t99.5 -33q74 0 125 51l548 548 q36 36 20 75q-7 16 -21.5 26t-32.5 10q-26 0 -50 -23q-13 -12 -39 -38l-341 -338q-15 -15 -35.5 -15.5t-34.5 13.5t-14 34.5t14 34.5q327 333 361 367q35 35 67.5 51.5t78.5 16.5q14 0 29 -1q44 -8 74.5 -35.5t43.5 -68.5q14 -47 2 -96.5t-47 -84.5q-12 -11 -32 -32 t-79.5 -81t-114.5 -115t-124.5 -123.5t-123 -119.5t-96.5 -89t-57 -45q-56 -27 -120 -27q-70 0 -129 32t-93 89q-48 78 -35 173t81 163l511 511q71 72 111 96q91 55 198 55q80 0 152 -33q78 -36 129.5 -103t66.5 -154q17 -93 -11 -183.5t-94 -156.5l-482 -476 q-15 -15 -36 -16t-37 14t-17.5 34t14.5 35z",
    "heart-empty": "M649 949q48 68 109.5 104t121.5 38.5t118.5 -20t102.5 -64t71 -100.5t27 -123q0 -57 -33.5 -117.5t-94 -124.5t-126.5 -127.5t-150 -152.5t-146 -174q-62 85 -145.5 174t-150 152.5t-126.5 127.5t-93.5 124.5t-33.5 117.5q0 64 28 123t73 100.5t104 64t119 20 t120.5 -38.5t104.5 -104zM896 972q-33 0 -64.5 -19t-56.5 -46t-47.5 -53.5t-43.5 -45.5t-37.5 -19t-36 19t-40 45.5t-43 53.5t-54 46t-65.5 19q-67 0 -122.5 -55.5t-55.5 -132.5q0 -23 13.5 -51t46 -65t57.5 -63t76 -75l22 -22q15 -14 44 -44t50.5 -51t46 -44t41 -35t23 -12 t23.5 12t42.5 36t46 44t52.5 52t44 43q4 4 12 13q43 41 63.5 62t52 55t46 55t26 46t11.5 44q0 79 -53 133.5t-120 54.5z",
    "pushpin": "M902 1185l283 -282q15 -15 15 -36t-14.5 -35.5t-35.5 -14.5t-35 15l-36 35l-279 -267v-300l-212 210l-308 -307l-280 -203l203 280l307 308l-210 212h300l267 279l-35 36q-15 14 -15 35t14.5 35.5t35.5 14.5t35 -15z",
    "sort": "M400 300h150q21 0 25 -11t-10 -25l-230 -250q-14 -15 -35 -15t-35 15l-230 250q-14 14 -10 25t25 11h150v900h200v-900zM935 1184l230 -249q14 -14 10 -24.5t-25 -10.5h-150v-900h-200v900h-150q-21 0 -25 10.5t10 24.5l230 249q14 15 35 15t35 -15z",
    "sort-by-alphabet": "M1000 700h-100v100h-100v-100h-100v500h300v-500zM400 300h150q21 0 25 -11t-10 -25l-230 -250q-14 -15 -35 -15t-35 15l-230 250q-14 14 -10 25t25 11h150v900h200v-900zM801 1100v-200h100v200h-100zM1000 350l-200 -250h200v-100h-300v150l200 250h-200v100h300v-150z ",
    "sort-by-alphabet-alt": "M400 300h150q21 0 25 -11t-10 -25l-230 -250q-14 -15 -35 -15t-35 15l-230 250q-14 14 -10 25t25 11h150v900h200v-900zM1000 1050l-200 -250h200v-100h-300v150l200 250h-200v100h300v-150zM1000 0h-100v100h-100v-100h-100v500h300v-500zM801 400v-200h100v200h-100z ",
    "sort-by-order": "M400 300h150q21 0 25 -11t-10 -25l-230 -250q-14 -15 -35 -15t-35 15l-230 250q-14 14 -10 25t25 11h150v900h200v-900zM1000 700h-100v400h-100v100h200v-500zM1100 0h-100v100h-200v400h300v-500zM901 400v-200h100v200h-100z",
    "sort-by-order-alt": "M400 300h150q21 0 25 -11t-10 -25l-230 -250q-14 -15 -35 -15t-35 15l-230 250q-14 14 -10 25t25 11h150v900h200v-900zM1100 700h-100v100h-200v400h300v-500zM901 1100v-200h100v200h-100zM1000 0h-100v400h-100v100h200v-500z",
    "sort-by-attributes": "M400 300h150q21 0 25 -11t-10 -25l-230 -250q-14 -15 -35 -15t-35 15l-230 250q-14 14 -10 25t25 11h150v900h200v-900zM900 1000h-200v200h200v-200zM1000 700h-300v200h300v-200zM1100 400h-400v200h400v-200zM1200 100h-500v200h500v-200z",
    "sort-by-attributes-alt": "M400 300h150q21 0 25 -11t-10 -25l-230 -250q-14 -15 -35 -15t-35 15l-230 250q-14 14 -10 25t25 11h150v900h200v-900zM1200 1000h-500v200h500v-200zM1100 700h-400v200h400v-200zM1000 400h-300v200h300v-200zM900 100h-200v200h200v-200z",
    "login": "M550 1100h400q165 0 257.5 -92.5t92.5 -257.5v-400q0 -165 -92.5 -257.5t-257.5 -92.5h-400q-21 0 -35.5 14.5t-14.5 35.5v100q0 21 14.5 35.5t35.5 14.5h450q41 0 70.5 29.5t29.5 70.5v500q0 41 -29.5 70.5t-70.5 29.5h-450q-21 0 -35.5 14.5t-14.5 35.5v100 q0 21 14.5 35.5t35.5 14.5zM338 867l324 -284q16 -14 16 -33t-16 -33l-324 -284q-16 -14 -27 -9t-11 26v150h-250q-21 0 -35.5 14.5t-14.5 35.5v200q0 21 14.5 35.5t35.5 14.5h250v150q0 21 11 26t27 -9z",
    "flash": "M793 1182l9 -9q8 -10 5 -27q-3 -11 -79 -225.5t-78 -221.5l300 1q24 0 32.5 -17.5t-5.5 -35.5q-1 0 -133.5 -155t-267 -312.5t-138.5 -162.5q-12 -15 -26 -15h-9l-9 8q-9 11 -4 32q2 9 42 123.5t79 224.5l39 110h-302q-23 0 -31 19q-10 21 6 41q75 86 209.5 237.5 t228 257t98.5 111.5q9 16 25 16h9z",
    "log-out": "M350 1100h400q21 0 35.5 -14.5t14.5 -35.5v-100q0 -21 -14.5 -35.5t-35.5 -14.5h-450q-41 0 -70.5 -29.5t-29.5 -70.5v-500q0 -41 29.5 -70.5t70.5 -29.5h450q21 0 35.5 -14.5t14.5 -35.5v-100q0 -21 -14.5 -35.5t-35.5 -14.5h-400q-165 0 -257.5 92.5t-92.5 257.5v400 q0 165 92.5 257.5t257.5 92.5zM938 867l324 -284q16 -14 16 -33t-16 -33l-324 -284q-16 -14 -27 -9t-11 26v150h-250q-21 0 -35.5 14.5t-14.5 35.5v200q0 21 14.5 35.5t35.5 14.5h250v150q0 21 11 26t27 -9z",
    "new window": "M750 1200h400q21 0 35.5 -14.5t14.5 -35.5v-400q0 -21 -10.5 -25t-24.5 10l-109 109l-312 -312q-15 -15 -35.5 -15t-35.5 15l-141 141q-15 15 -15 35.5t15 35.5l312 312l-109 109q-14 14 -10 24.5t25 10.5zM456 900h-156q-41 0 -70.5 -29.5t-29.5 -70.5v-500 q0 -41 29.5 -70.5t70.5 -29.5h500q41 0 70.5 29.5t29.5 70.5v148l200 200v-298q0 -165 -93.5 -257.5t-256.5 -92.5h-400q-165 0 -257.5 92.5t-92.5 257.5v400q0 165 92.5 257.5t257.5 92.5h300z",
    "record": "M600 1186q119 0 227.5 -46.5t187 -125t125 -187t46.5 -227.5t-46.5 -227.5t-125 -187t-187 -125t-227.5 -46.5t-227.5 46.5t-187 125t-125 187t-46.5 227.5t46.5 227.5t125 187t187 125t227.5 46.5zM600 1022q-115 0 -212 -56.5t-153.5 -153.5t-56.5 -212t56.5 -212 t153.5 -153.5t212 -56.5t212 56.5t153.5 153.5t56.5 212t-56.5 212t-153.5 153.5t-212 56.5zM600 794q80 0 137 -57t57 -137t-57 -137t-137 -57t-137 57t-57 137t57 137t137 57z",
    "save": "M450 1200h200q21 0 35.5 -14.5t14.5 -35.5v-350h245q20 0 25 -11t-9 -26l-383 -426q-14 -15 -33.5 -15t-32.5 15l-379 426q-13 15 -8.5 26t25.5 11h250v350q0 21 14.5 35.5t35.5 14.5zM50 300h1000q21 0 35.5 -14.5t14.5 -35.5v-250h-1100v250q0 21 14.5 35.5t35.5 14.5z M900 200v-50h100v50h-100z",
    "open": "M583 1182l378 -435q14 -15 9 -31t-26 -16h-244v-250q0 -20 -17 -35t-39 -15h-200q-20 0 -32 14.5t-12 35.5v250h-250q-20 0 -25.5 16.5t8.5 31.5l383 431q14 16 33.5 17t33.5 -14zM50 300h1000q21 0 35.5 -14.5t14.5 -35.5v-250h-1100v250q0 21 14.5 35.5t35.5 14.5z M900 200v-50h100v50h-100z",
    "floppy-disk": "M1100 1000v-850q0 -21 -14.5 -35.5t-35.5 -14.5h-150v400h-700v-400h-150q-21 0 -35.5 14.5t-14.5 35.5v1000q0 20 14.5 35t35.5 15h250v-300h500v300h100zM700 1000h-100v200h100v-200z",
    "floppy-saved": "M1100 1000l-2 -149l-299 -299l-95 95q-9 9 -21.5 9t-21.5 -9l-149 -147h-312v-400h-150q-21 0 -35.5 14.5t-14.5 35.5v1000q0 20 14.5 35t35.5 15h250v-300h500v300h100zM700 1000h-100v200h100v-200zM1132 638l106 -106q7 -7 7 -17.5t-7 -17.5l-420 -421q-8 -7 -18 -7 t-18 7l-202 203q-8 7 -8 17.5t8 17.5l106 106q7 8 17.5 8t17.5 -8l79 -79l297 297q7 7 17.5 7t17.5 -7z",
    "floppy-remove": "M1100 1000v-269l-103 -103l-134 134q-15 15 -33.5 16.5t-34.5 -12.5l-266 -266h-329v-400h-150q-21 0 -35.5 14.5t-14.5 35.5v1000q0 20 14.5 35t35.5 15h250v-300h500v300h100zM700 1000h-100v200h100v-200zM1202 572l70 -70q15 -15 15 -35.5t-15 -35.5l-131 -131 l131 -131q15 -15 15 -35.5t-15 -35.5l-70 -70q-15 -15 -35.5 -15t-35.5 15l-131 131l-131 -131q-15 -15 -35.5 -15t-35.5 15l-70 70q-15 15 -15 35.5t15 35.5l131 131l-131 131q-15 15 -15 35.5t15 35.5l70 70q15 15 35.5 15t35.5 -15l131 -131l131 131q15 15 35.5 15 t35.5 -15z",
    "floppy-save": "M1100 1000v-300h-350q-21 0 -35.5 -14.5t-14.5 -35.5v-150h-500v-400h-150q-21 0 -35.5 14.5t-14.5 35.5v1000q0 20 14.5 35t35.5 15h250v-300h500v300h100zM700 1000h-100v200h100v-200zM850 600h100q21 0 35.5 -14.5t14.5 -35.5v-250h150q21 0 25 -10.5t-10 -24.5 l-230 -230q-14 -14 -35 -14t-35 14l-230 230q-14 14 -10 24.5t25 10.5h150v250q0 21 14.5 35.5t35.5 14.5z",
    "floppy-open": "M1100 1000v-400l-165 165q-14 15 -35 15t-35 -15l-263 -265h-402v-400h-150q-21 0 -35.5 14.5t-14.5 35.5v1000q0 20 14.5 35t35.5 15h250v-300h500v300h100zM700 1000h-100v200h100v-200zM935 565l230 -229q14 -15 10 -25.5t-25 -10.5h-150v-250q0 -20 -14.5 -35 t-35.5 -15h-100q-21 0 -35.5 15t-14.5 35v250h-150q-21 0 -25 10.5t10 25.5l230 229q14 15 35 15t35 -15z",
    "credit-card": "M50 1100h1100q21 0 35.5 -14.5t14.5 -35.5v-150h-1200v150q0 21 14.5 35.5t35.5 14.5zM1200 800v-550q0 -21 -14.5 -35.5t-35.5 -14.5h-1100q-21 0 -35.5 14.5t-14.5 35.5v550h1200zM100 500v-200h400v200h-400z",
    "transfer": "M935 1165l248 -230q14 -14 14 -35t-14 -35l-248 -230q-14 -14 -24.5 -10t-10.5 25v150h-400v200h400v150q0 21 10.5 25t24.5 -10zM200 800h-50q-21 0 -35.5 14.5t-14.5 35.5v100q0 21 14.5 35.5t35.5 14.5h50v-200zM400 800h-100v200h100v-200zM18 435l247 230 q14 14 24.5 10t10.5 -25v-150h400v-200h-400v-150q0 -21 -10.5 -25t-24.5 10l-247 230q-15 14 -15 35t15 35zM900 300h-100v200h100v-200zM1000 500h51q20 0 34.5 -14.5t14.5 -35.5v-100q0 -21 -14.5 -35.5t-34.5 -14.5h-51v200z",
    "sd-video": "M200 1100h700q124 0 212 -88t88 -212v-500q0 -124 -88 -212t-212 -88h-700q-124 0 -212 88t-88 212v500q0 124 88 212t212 88zM100 900v-700h900v700h-900zM500 700h-200v-100h200v-300h-300v100h200v100h-200v300h300v-100zM900 700v-300l-100 -100h-200v500h200z M700 700v-300h100v300h-100z",
    "cloud-download": "M503 1089q110 0 200.5 -59.5t134.5 -156.5q44 14 90 14q120 0 205 -86.5t85 -207t-85 -207t-205 -86.5h-128v250q0 21 -14.5 35.5t-35.5 14.5h-300q-21 0 -35.5 -14.5t-14.5 -35.5v-250h-222q-80 0 -136 57.5t-56 136.5q0 69 43 122.5t108 67.5q-2 19 -2 37q0 100 49 185 t134 134t185 49zM525 500h150q10 0 17.5 -7.5t7.5 -17.5v-275h137q21 0 26 -11.5t-8 -27.5l-223 -244q-13 -16 -32 -16t-32 16l-223 244q-13 16 -8 27.5t26 11.5h137v275q0 10 7.5 17.5t17.5 7.5z",
    "cloud-upload": "M502 1089q110 0 201 -59.5t135 -156.5q43 15 89 15q121 0 206 -86.5t86 -206.5q0 -99 -60 -181t-150 -110l-378 360q-13 16 -31.5 16t-31.5 -16l-381 -365h-9q-79 0 -135.5 57.5t-56.5 136.5q0 69 43 122.5t108 67.5q-2 19 -2 38q0 100 49 184.5t133.5 134t184.5 49.5z M632 467l223 -228q13 -16 8 -27.5t-26 -11.5h-137v-275q0 -10 -7.5 -17.5t-17.5 -7.5h-150q-10 0 -17.5 7.5t-7.5 17.5v275h-137q-21 0 -26 11.5t8 27.5q199 204 223 228q19 19 31.5 19t32.5 -19z",
    "cd": "M1010 1010q111 -111 150.5 -260.5t0 -299t-150.5 -260.5q-83 -83 -191.5 -126.5t-218.5 -43.5t-218.5 43.5t-191.5 126.5q-111 111 -150.5 260.5t0 299t150.5 260.5q83 83 191.5 126.5t218.5 43.5t218.5 -43.5t191.5 -126.5zM476 1065q-4 0 -8 -1q-121 -34 -209.5 -122.5 t-122.5 -209.5q-4 -12 2.5 -23t18.5 -14l36 -9q3 -1 7 -1q23 0 29 22q27 96 98 166q70 71 166 98q11 3 17.5 13.5t3.5 22.5l-9 35q-3 13 -14 19q-7 4 -15 4zM512 920q-4 0 -9 -2q-80 -24 -138.5 -82.5t-82.5 -138.5q-4 -13 2 -24t19 -14l34 -9q4 -1 8 -1q22 0 28 21 q18 58 58.5 98.5t97.5 58.5q12 3 18 13.5t3 21.5l-9 35q-3 12 -14 19q-7 4 -15 4zM719.5 719.5q-49.5 49.5 -119.5 49.5t-119.5 -49.5t-49.5 -119.5t49.5 -119.5t119.5 -49.5t119.5 49.5t49.5 119.5t-49.5 119.5zM855 551q-22 0 -28 -21q-18 -58 -58.5 -98.5t-98.5 -57.5 q-11 -4 -17 -14.5t-3 -21.5l9 -35q3 -12 14 -19q7 -4 15 -4q4 0 9 2q80 24 138.5 82.5t82.5 138.5q4 13 -2.5 24t-18.5 14l-34 9q-4 1 -8 1zM1000 515q-23 0 -29 -22q-27 -96 -98 -166q-70 -71 -166 -98q-11 -3 -17.5 -13.5t-3.5 -22.5l9 -35q3 -13 14 -19q7 -4 15 -4 q4 0 8 1q121 34 209.5 122.5t122.5 209.5q4 12 -2.5 23t-18.5 14l-36 9q-3 1 -7 1z",
    "save-file": "M700 800h300v-380h-180v200h-340v-200h-380v755q0 10 7.5 17.5t17.5 7.5h575v-400zM1000 900h-200v200zM700 300h162l-212 -212l-212 212h162v200h100v-200zM520 0h-395q-10 0 -17.5 7.5t-7.5 17.5v395zM1000 220v-195q0 -10 -7.5 -17.5t-17.5 -7.5h-195z",
    "open-file": "M700 800h300v-520l-350 350l-550 -550v1095q0 10 7.5 17.5t17.5 7.5h575v-400zM1000 900h-200v200zM862 200h-162v-200h-100v200h-162l212 212zM480 0h-355q-10 0 -17.5 7.5t-7.5 17.5v55h380v-80zM1000 80v-55q0 -10 -7.5 -17.5t-17.5 -7.5h-155v80h180z",
    "level-up": "M1162 800h-162v-200h100l100 -100h-300v300h-162l212 212zM200 800h200q27 0 40 -2t29.5 -10.5t23.5 -30t7 -57.5h300v-100h-600l-200 -350v450h100q0 36 7 57.5t23.5 30t29.5 10.5t40 2zM800 400h240l-240 -400h-800l300 500h500v-100z",
    "copy": "M650 1100h100q21 0 35.5 -14.5t14.5 -35.5v-50h50q21 0 35.5 -14.5t14.5 -35.5v-100q0 -21 -14.5 -35.5t-35.5 -14.5h-300q-21 0 -35.5 14.5t-14.5 35.5v100q0 21 14.5 35.5t35.5 14.5h50v50q0 21 14.5 35.5t35.5 14.5zM1000 850v150q41 0 70.5 -29.5t29.5 -70.5v-800 q0 -41 -29.5 -70.5t-70.5 -29.5h-600q-1 0 -20 4l246 246l-326 326v324q0 41 29.5 70.5t70.5 29.5v-150q0 -62 44 -106t106 -44h300q62 0 106 44t44 106zM412 250l-212 -212v162h-200v100h200v162z",
    "paste": "M450 1100h100q21 0 35.5 -14.5t14.5 -35.5v-50h50q21 0 35.5 -14.5t14.5 -35.5v-100q0 -21 -14.5 -35.5t-35.5 -14.5h-300q-21 0 -35.5 14.5t-14.5 35.5v100q0 21 14.5 35.5t35.5 14.5h50v50q0 21 14.5 35.5t35.5 14.5zM800 850v150q41 0 70.5 -29.5t29.5 -70.5v-500 h-200v-300h200q0 -36 -7 -57.5t-23.5 -30t-29.5 -10.5t-40 -2h-600q-41 0 -70.5 29.5t-29.5 70.5v800q0 41 29.5 70.5t70.5 29.5v-150q0 -62 44 -106t106 -44h300q62 0 106 44t44 106zM1212 250l-212 -212v162h-200v100h200v162z",
    "alert": "M658 1197l637 -1104q23 -38 7 -65.5t-60 -27.5h-1276q-44 0 -60 27.5t7 65.5l637 1104q22 39 54 39t54 -39zM704 800h-208q-20 0 -32 -14.5t-8 -34.5l58 -302q4 -20 21.5 -34.5t37.5 -14.5h54q20 0 37.5 14.5t21.5 34.5l58 302q4 20 -8 34.5t-32 14.5zM500 300v-100h200 v100h-200z",
    "duplicate": "M900 800h300v-575q0 -10 -7.5 -17.5t-17.5 -7.5h-375v591l-300 300v84q0 10 7.5 17.5t17.5 7.5h375v-400zM1200 900h-200v200zM400 600h300v-575q0 -10 -7.5 -17.5t-17.5 -7.5h-650q-10 0 -17.5 7.5t-7.5 17.5v950q0 10 7.5 17.5t17.5 7.5h375v-400zM700 700h-200v200z ",
    "scissors": "M641 900l423 247q19 8 42 2.5t37 -21.5l32 -38q14 -15 12.5 -36t-17.5 -34l-139 -120h-390zM50 1100h106q67 0 103 -17t66 -71l102 -212h823q21 0 35.5 -14.5t14.5 -35.5v-50q0 -21 -14 -40t-33 -26l-737 -132q-23 -4 -40 6t-26 25q-42 67 -100 67h-300q-62 0 -106 44 t-44 106v200q0 62 44 106t106 44zM173 928h-80q-19 0 -28 -14t-9 -35v-56q0 -51 42 -51h134q16 0 21.5 8t5.5 24q0 11 -16 45t-27 51q-18 28 -43 28zM550 727q-32 0 -54.5 -22.5t-22.5 -54.5t22.5 -54.5t54.5 -22.5t54.5 22.5t22.5 54.5t-22.5 54.5t-54.5 22.5zM130 389 l152 130q18 19 34 24t31 -3.5t24.5 -17.5t25.5 -28q28 -35 50.5 -51t48.5 -13l63 5l48 -179q13 -61 -3.5 -97.5t-67.5 -79.5l-80 -69q-47 -40 -109 -35.5t-103 51.5l-130 151q-40 47 -35.5 109.5t51.5 102.5zM380 377l-102 -88q-31 -27 2 -65l37 -43q13 -15 27.5 -19.5 t31.5 6.5l61 53q19 16 14 49q-2 20 -12 56t-17 45q-11 12 -19 14t-23 -8z",
    "scale": "M212 1198h780q86 0 147 -61t61 -147v-416q0 -51 -18 -142.5t-36 -157.5l-18 -66q-29 -87 -93.5 -146.5t-146.5 -59.5h-572q-82 0 -147 59t-93 147q-8 28 -20 73t-32 143.5t-20 149.5v416q0 86 61 147t147 61zM600 1045q-70 0 -132.5 -11.5t-105.5 -30.5t-78.5 -41.5 t-57 -45t-36 -41t-20.5 -30.5l-6 -12l156 -243h560l156 243q-2 5 -6 12.5t-20 29.5t-36.5 42t-57 44.5t-79 42t-105 29.5t-132.5 12zM762 703h-157l195 261z",
    "ice-lolly": "M475 1300h150q103 0 189 -86t86 -189v-500q0 -41 -42 -83t-83 -42h-450q-41 0 -83 42t-42 83v500q0 103 86 189t189 86zM700 300v-225q0 -21 -27 -48t-48 -27h-150q-21 0 -48 27t-27 48v225h300z",
    "triangle-right": "M865 565l-494 -494q-23 -23 -41 -23q-14 0 -22 13.5t-8 38.5v1000q0 25 8 38.5t22 13.5q18 0 41 -23l494 -494q14 -14 14 -35t-14 -35z",
    "triangle-left": "M335 635l494 494q29 29 50 20.5t21 -49.5v-1000q0 -41 -21 -49.5t-50 20.5l-494 494q-14 14 -14 35t14 35z",
    "triangle-bottom": "M100 900h1000q41 0 49.5 -21t-20.5 -50l-494 -494q-14 -14 -35 -14t-35 14l-494 494q-29 29 -20.5 50t49.5 21z",
    "triangle-top": "M635 865l494 -494q29 -29 20.5 -50t-49.5 -21h-1000q-41 0 -49.5 21t20.5 50l494 494q14 14 35 14t35 -14z",
    "plus": "M450 1100h200q21 0 35.5 -14.5t14.5 -35.5v-350h350q21 0 35.5 -14.5t14.5 -35.5v-200q0 -21 -14.5 -35.5t-35.5 -14.5h-350v-350q0 -21 -14.5 -35.5t-35.5 -14.5h-200q-21 0 -35.5 14.5t-14.5 35.5v350h-350q-21 0 -35.5 14.5t-14.5 35.5v200q0 21 14.5 35.5t35.5 14.5 h350v350q0 21 14.5 35.5t35.5 14.5z",
};

function get_icon_svg(name, w, h) {
    var content = "";
    if (typeof w == 'undefined') w = "1.3em";
    if (typeof h == 'undefined') h = "1.2em";
    var has_error = false;
    try {
        content = list_icon[name];
    }
    catch (e) {
        console.error("Parsing error:", e);
        has_error = true;
    }
    if (has_error) return "";
    var icon = "<svg width='" + w + "' height='" + h + "' viewBox='0 0 1300 1200'><g transform='translate(30,1200) scale(1, -1)'><path  fill='currentColor' d='";
    icon += content;
    icon += "' /></g></svg>";
    return icon;
}
