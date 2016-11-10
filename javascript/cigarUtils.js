/**
 * Created by thankia on 16/09/2016.
 */
/**
 * Useful when dealing with a subtree and deletion is present because of  absence member, replaces with it 'I' to ignore
 * @param ref_cigar_string reference cigar string
 * @returns {*}
 */

var sequence_list = {}
var cigar_json = {}
var align_list = {}


function separateSeq(){
    var sequences = $("#sequence").val();

    var sequence_array = sequences.split(">")
    for (var i=1; i<sequence_array.length; i++)
    {
        console.log(sequence_array[i])
        sequence_chunks = sequence_array[i].split("\n")
        sequence_id = sequence_chunks.shift();
        sequence = sequence_chunks.join("")
        sequence_list[sequence_id] = sequence;
    }

    var cigars = $("#cigar").val();

    var cigar_array = cigars.split("\>")
    for (var i=1; i<cigar_array.length; i++)
    {
        console.log(cigar_array[i])
        cigar_chunks = cigar_array[i].split("\n")
        cigar_id = cigar_chunks.shift();
        cigar = cigar_chunks.join("")
        cigar_json[cigar_id] = cigar;
    }
    checkCigar()
    joinAlignment()
    printAlignment()

}

function printAlignment(){
    var first = ""
    for (var id in align_list){
      first = id; 
      break;  
    } 

    var formatted_seq = "<table>"

    for(i=0; i<align_list[first].length; i++)
    {
        for (var id in align_list) {
            formatted_seq += "<tr><td>"+id+"<td>"+align_list[id][i]+"</tr>"
        }
        formatted_seq += "<tr><td colspan=2>&nbsp;</td>"
    }

    $("#output").append(formatted_seq)

    
}

function joinAlignment(){
    for (var id in cigar_json) {
        var cigar_string = cigar_json[id];
        console.log(cigar_string)
        var j=0;
        var seq = []
        var line = 0;
        seq[line] = "";
        var count=1;

        for (var i=0; i<cigar_string.length; i++)
        {
            if(cigar_string.charAt(i) == 'M')
            {
                seq[line] += sequence_list[id].charAt(j)
                j++;
            }
            else if(cigar_string.charAt(i) == 'D')
            {
                seq[line] += "-"
            }
            if(count == 70)
            {
                line++;
                seq[line] = "";
                count = 0;
            }
            count++;

        }
        align_list[id] = seq
    }
}

function checkCigar(){
    var cigar_list = [];
    var cigar_id = [];
    for (var id in cigar_json) {
        if (sequence_list.hasOwnProperty(id)) {
            var cigar_string = expandCigar(cigar_json[id])
            cigar_list.push(cigar_string);
            cigar_id.push(id)
        }
    }

    

    var pos = [];
    for (var i = 0; i < cigar_list[0].length; i++) {
        if (cigar_list[0][i] == 'D') {
            for (var j = 1; j < cigar_list.length; j++) {
                if (cigar_list[j][i] == 'M') {
                    break;
                }
                if (j == cigar_list.length - 1) {
                    cigar_list[0] = replaceAt(cigar_list[0], i, "I")
                    pos.push(i)
                }
            }
        }
    }

    // to clean all cigars...
    for (var i = 0; i < cigar_list.length; i++) {
        cigar_list[i] = cigar_list[i].split("")

        for (var j = pos.length - 1; j >= 0; j--) {
            cigar_list[i].splice(pos[j], 1);
        }

        cigar_string = cigar_list[i].join("")

        cigar_json[cigar_id[i]] = cigar_string

    }

}

function replaceAt(str, index, character) {
    return str.substr(0, index) + character + str.substr(index + character.length);
}


function expandCigar(cigar) {
    var cigar_string = ""
    var cigar = cigar.replace(/([SIXMND])/g, ":$1,");
    console.log(cigar)

    var cigars_array = cigar.split(',');
    // toNucleotide = $('input[name=seq_type]:checked').val()
    var multiply = 1;
    // if(toNucleotide == "protein"){
        // multiply = 3
    // }

    for (var j = 0; j < cigars_array.length - 1; j++) {
        var cigar = cigars_array[j].split(":");
        var key = cigar[1];
        var length = cigar[0] * multiply;
        if (!length) {
            length = multiply
        }
        while (length--) {
            cigar_string += key;
        }

        cigar_string += "";
    }
    return cigar_string;
}

function compressCigar(cigar_string) {
    cigar_string = cigar_string.replace(/(MD)/g, "M,D");
    cigar_string = cigar_string.replace(/(DM)/g, "D,M");
    var cigar_array = cigar_string.split(",")
    var new_cigar = ""

    for (var a = 0; a < cigar_array.length; a++) {
        var key = cigar_array[a].charAt(0)
        var length = cigar_array[a].length;

        if (length > 1) {
            new_cigar += length
        }
        new_cigar += key
    }

    return new_cigar;
}

/**
 * formats hit cigar to match with reference cigar for drawing on genes
 * @param ref_exons list of reference exons
 * @param hit_cigar hit cigar string
 * @param colours colour array
 * @param ref_cigar reference cigar string
 * @param reverse hit strand is reverse or not
 * @param ref_strand reference strand
 * @returns {string} formated cigar
 */
function format_ref_cigar() {

    console.log("format_ref_cigar 1")
    var i = null;
    jQuery.map(syntenic_data.member[syntenic_data.ref].Transcript, function (obj) {
        if (obj.Translation && obj.Translation.id == protein_member_id) {
            i = syntenic_data.member[syntenic_data.ref].Transcript.indexOf(obj)
        }
    });

    var ref_exons = syntenic_data.member[syntenic_data.ref].Transcript[i].Exon

    var ref_cigar = syntenic_data.cigar[protein_member_id]

    var no_of_exons = ref_exons.length;

    var ref_strand = syntenic_data.member[syntenic_data.ref].strand;

    var ref_exon_array = [];

    ref_cigar += 'M'
    while (i < no_of_exons) {
        var length = ref_exons[i].length
        if (ref_exons[i].length == null) {
            length = (ref_exons[i].end - ref_exons[i].start) + 1
        }
        var ref_exon = length
        if (parseInt(ref_exon) >= 0) {
            ref_exon_array.push(ref_exon)
        }
        i++;
    }


    var cigar_string = expandCigar(ref_cigar, "true")


    var i = 0
    var total_len = 0;
    var flag = false;
    var cigar_string_match = cigar_string.replace(/D/g, '');

    // if cigar is shorter than CDS than last CDSs becomes 0

    while (i < ref_exon_array.length) {
        if (flag == false) {
            if (parseInt(total_len) + parseInt(ref_exon_array[i]) < cigar_string_match.length) {
                total_len += ref_exon_array[i];
            }
            else {
                ref_exon_array[i] = cigar_string_match.length - total_len;
                total_len = cigar_string_match.length;
                flag = true;
            }
        } else {
            ref_exon_array[i] = 0;
        }
        i++;
    }


    var ref_cigar_count = 0;

    var hit_position = 0;

    var ref_exon_number = 0;
    var count_match = 0;

    var formated_ref_cigar = []

    var last_pos = 0;
    // dividing reference cigar into chunks based on exon length (ignoring deletions)
    while (ref_cigar_count < cigar_string.length) {

        if (cigar_string.charAt(ref_cigar_count) == 'M') {
            if (count_match == ref_exon_array[ref_exon_number]) {
                ref_exon_number++;
                formated_ref_cigar.push(cigar_string.substr(last_pos, hit_position));
                count_match = 0;
                last_pos += hit_position;
                hit_position = 0;
            }
            count_match++;
        }
        hit_position++;
        ref_cigar_count++;
    }

    formated_ref_cigar.push(cigar_string.substr(last_pos, hit_position));
    var i = 0;


    return formated_ref_cigar;

}

/**
 * formats hit cigar to match with reference cigar for drawing on genes
 * @param ref_exons list of reference exons
 * @param hit_cigar hit cigar string
 * @param colours colour array
 * @param ref_cigar reference cigar string
 * @param reverse hit strand is reverse or not
 * @param ref_strand reference strand
 * @returns {string} formated cigar
 */
function formatCigar(ref_exons, hit_cigar, colours, ref_cigar, reverse, ref_strand) {
    var no_of_exons = ref_exons.length
    var hit_cigar_arr = [];
    var ref_exon_array = [];
    var last_pos = 0;
    var i = 0
    var j = 0;

    var ref_cigar_array = ref_data.formated_cigar;
    var cigar_string = ref_data.formated_cigar.join("");


    while (i < ref_cigar_array.length) {
        ref_exon_array.push(ref_cigar_array[i].replace(/D/g, "").length)
        i++;
    }

    if (reverse) {
        ref_exon_array = ref_exon_array.reverse();
        var sum = 0;

        for (i = 0; i < ref_exon_array.length; i++) {
            sum += Number(ref_exon_array[i]);
        }
        var ref_cigar = cigar_string.replace(/D/g, "").length
        if (sum > ref_cigar) {
            ref_exon_array[0] = ref_exon_array[0] - (sum - ref_cigar)
        }
    }


    if (reverse && ref_strand == 1) {
        cigar_string = cigar_string.split("").reverse().join("");
        hit_cigar = hit_cigar.split("").reverse().join("");
        // ref_cigar_array = ref_cigar_array.reverse()
    }


    // if cigar string is D in all sequences (because of subset) that that part get removed
    while (j < cigar_string.length) {
        if (cigar_string.charAt(j) == 'D') {
            if (hit_cigar.charAt(j) == 'M') {
                hit_cigar = replaceAt(hit_cigar, j, "_");
            }
            else if (hit_cigar.charAt(j) == 'D') {
                hit_cigar = replaceAt(hit_cigar, j, "I");
            }
        }
        j++;
    }

    var ref_cigar_count = 0;

    var hit_position = 0;

    var ref_exon_number = 0;
    var count_match = 0;

    var temp_array = [];

    // dividing reference cigar into chunks based on exon length (ignoring deletions)
    while (ref_cigar_count < cigar_string.length) {

        if (cigar_string.charAt(ref_cigar_count) == 'M') {
            if (count_match == ref_exon_array[ref_exon_number]) {


                ref_exon_number++;
                hit_cigar_arr.push(hit_cigar.substr(last_pos, hit_position));
                temp_array.push(hit_position + " : " + ref_exon_number)

                count_match = 0;
                last_pos += hit_position;
                hit_position = 0;
                if (reverse) {
                }
            }
            count_match++;
        }
        hit_position++;
        ref_cigar_count++;
    }


    hit_cigar_arr.push(hit_cigar.substr(last_pos, hit_position));

    return hit_cigar_arr.join("-");

}
