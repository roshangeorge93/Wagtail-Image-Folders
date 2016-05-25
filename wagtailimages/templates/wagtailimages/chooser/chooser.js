{% load i18n %}
function(modal) {
    var searchUrl = $('form.image-search', modal.body).attr('action');

    /* currentTag stores the tag currently being filtered on, so that we can
    preserve this when paginating */
    var currentTag;

	/* currentFolder store the current folder we are browsing in, we then use
	this in the upload form to make sure the image goes into the right folder */
	var currentFolder;
	var currentFolderTitle;

    function ajaxifyLinks (context) {
        $('.listing-images a', context).click(function() {
            modal.loadUrl(this.href);
            return false;
        });

		// Main Pagination
        $('#image-results .pagination a').click(function() {
            var page = this.getAttribute("data-page");
            setPage(page);
            return false;
        });

		// Search Pagination
        $('#image-search-results .pagination a').click(function() {
            var page = this.getAttribute("data-page");
            setSearchPage(page);
            return false;
        });

        $('.listing-folders a', context).click(function() {
            var folder = this.getAttribute("data-folder");
            var folderTitle = this.getAttribute("data-folder-title");
            setFolder(folder, folderTitle);
            return false;
        });
	
        $('a#switch-to-upload-tab', context).click(function() {
			// Switch to folders tab
			$('.modal a[href="#upload"]').tab('show');
			return false;
		});
    }

    function fetchResults(requestData) {
        $.ajax({
            url: searchUrl,
            data: requestData,
            success: function(data, status) {
                $('#image-results').html(data);
                ajaxifyLinks($('#image-results'));
				// Switch to folders tab
				$('.modal a[href="#folders"]').tab('show');
            },
			error: function(){
				alert('Something went wrong');
			}
        });
    }

    function fetchSearchResults(requestData) {
        $.ajax({
            url: searchUrl,
            data: requestData,
            success: function(data, status) {
                $('#image-search-results').html(data);
                ajaxifyLinks($('#image-search-results'));
            },
			error: function(){
				alert('Something went wrong');
			}
        });
    }

    function fetchFolders(requestData) {
        $.ajax({
            url: searchUrl,
            data: requestData,
            success: function(data, status) {
                $('#folder-results-wrapper').html(data);
                ajaxifyLinks($('#folder-results-wrapper'));
            },
			error: function(){
				alert('Something went wrong');
			}
        });
    }

    function search() {
        /* Searching causes currentTag to be cleared - otherwise there's
        no way to de-select a tag */
        currentTag = null;
        fetchSearchResults({
            q: $('#id_q').val(),
            collection_id: $('#collection_chooser_collection_id').val()
        });
        return false;
    }

    function setPage(page) {
        params = {p: page};
        if ($('#id_q').val().length){
            params['q'] = $('#id_q').val();
        }
        if (currentTag) {
            params['tag'] = currentTag;
        }
        params['collection_id'] = $('#collection_chooser_collection_id').val();
        fetchResults(params);
        return false;
    }

    function setSearchPage(page) {
		alert("Page in search");
        params = {p: page};
        if ($('#id_q').val().length){
            params['q'] = $('#id_q').val();
        }
        if (currentTag) {
            params['tag'] = currentTag;
        }
        params['collection_id'] = $('#collection_chooser_collection_id').val();
        fetchSearchResults(params);
        return false;
    }

	function updateLabels(){
		// Folder title label
		if (currentFolderTitle){
			$('.label-folder-title').html(currentFolderTitle);
		} else {
			$('.label-folder-title').html('Root');	
		}
	}

    function setFolder(folder, folderTitle) {
		currentFolder = folder;
		currentFolderTitle = folderTitle;
		updateLabels();
		// Set currentFolder in form
		$('form.image-upload input#id_folder').val(folder)
        params = {folder: folder};
		//TODO - reset currentTag or query?
        fetchResults(params);
		// Second query to get folders
        params = {folder: folder, folders_only: '1'};
        fetchFolders(params);
        return false;
    }

    ajaxifyLinks(modal.body);

    $('form.image-upload', modal.body).submit(function() {
        var formdata = new FormData(this);

        $.ajax({
            url: this.action,
            data: formdata,
            processData: false,
            contentType: false,
            type: 'POST',
            dataType: 'text',
            success: function(response){
                modal.loadResponseText(response);
            },
            error: function(response, textStatus, errorThrown) {
                {% trans "Server Error" as error_label %}
                {% trans "Report this error to your webmaster with the following information:" as error_message %}
                message = '{{ error_message|escapejs }}<br />' + errorThrown + ' - ' + response.status;
                $('#upload').append(
                    '<div class="help-block help-critical">' +
                    '<strong>{{ error_label|escapejs }}: </strong>' + message + '</div>');
            }
        });

        return false;
    });

    $('form.image-search', modal.body).submit(search);

    $('#id_q').on('input', function() {
        //clearTimeout($.data(this, 'timer'));
        //var wait = setTimeout(search, 200);
        //$(this).data('timer', wait);
    });
    $('#collection_chooser_collection_id').change(search);
    $('a.suggested-tag').click(function() {
        currentTag = $(this).text();
        $('#id_q').val('');
        fetchSearchResults({
            'tag': currentTag,
            collection_id: $('#collection_chooser_collection_id').val()
        });
        return false;
    });

    {% url 'wagtailadmin_tag_autocomplete' as autocomplete_url %}

    /* Add tag entry interface (with autocompletion) to the tag field of the image upload form */
    $('#id_tags', modal.body).tagit({
        autocomplete: {source: "{{ autocomplete_url|addslashes }}"}
    });
}