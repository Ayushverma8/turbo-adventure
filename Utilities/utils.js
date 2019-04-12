
module.exports = {
    RemoveAllDuplicates: function removeDuplicates(arr_links) {
        var uniqueLinks = [];
        arr_links.forEach(element => {
            if ( uniqueLinks.indexOf(element) === -1 ) {
                uniqueLinks.push(element);
            }
        });

        return uniqueLinks;
    }


}