var Editor = function(container, mode) {
    var self = this; // Tracking 'this' can be finicky; use 'self' instead.
    var mContainer = $(container);
    var mToolbarHolder;
    var mTabHolder;
    var mCurrentDocument = null;
    var mSyntaxMode = mode;
    var mExpectedHeight = null;
    var mUntitledDocumentCount = 0;

    var mOpenDocuments = {}; // Mapping of document paths to editor instances.

    this.addButtonGroup = function(buttons) {
        var group = $('<div class="btn-group">');
        _.each(buttons, function(button) {
            button.render(group);
        });
        mToolbarHolder.append(group);
    };

    var focusTab = function(doc) {
        doc.tab.find('a').tab('show');
        if(mCurrentDocument) mCurrentDocument.el.hide();
        doc.el.show().addClass('active');
        doc.cm.refresh();
        doc.cm.focus();
        mCurrentDocument = doc;
    };

    var unfocusTab = function(doc) {
        if(!doc) return;
        doc.el.removeClass("active").hide();
        doc.tab.removeClass('active');
    };

    this.focusTab = function(filename) {
        focusTab(mOpenDocuments[filename]);
    };

    this.unfocusTab = function(filename) {
        unfocusTab(mOpenDocuments[filename]);
    };

    var create_cm_instance = function(container, content) {
        var cm = new CodeMirror(container[0], {
            indentUint: 4,
            lineNumbers: true,
            electricChars: true,
            matchBracktes: true,
            autoCloseBrackets: true,
            smartIndent: true,
            indentWithTabs: true,
            styleActiveLine: true,
            value: content,
            mode: mode
        });
        cm.on('save', function() {
            alert("This would save, if it had anything to save to.");
        });
        return cm;
    }

    this.openTab = function(filename, content, activate) {
        var has_location = true;
        // If no filename is given, invent one. We'll need to prompt later.
        if(!filename) {
            has_location = false;
            filename = '*untitled ' + (++mUntitledDocumentCount);
        }
        var id = _.uniqueId('edit_tab');
        var editPane = $('<div>', {'class': 'tab-pane', id: id}).hide();
        var cm = create_cm_instance(editPane, content);
        var tab = $('<li>');

        var doc = {el: editPane, tab: tab, cm: cm, has_location: has_location};

        var a = $('<a>', {href: '#' + id}).text(filename).click(function(e) { e.preventDefault(); focusTab(doc); });
        tab.append(a);

        mTabHolder.append(tab);

        mContainer.append(editPane);

        if(!_.size(mOpenDocuments) || activate) {
            unfocusTab(mCurrentDocument);
            focusTab(doc);
        }

        // Stash these away somewhere.
        mOpenDocuments[filename] = doc;
        if(mExpectedHeight) self.setHeight(mExpectedHeight);
    };

    this.doc = function(filename) {
        return mOpenDocuments[filename];
    };

    // Why does doing anything vertically suck so much?
    this.setHeight = function(height) {
        mExpectedHeight = height;
        mContainer.height(height);
        var offset = mCurrentDocument.el.position().top;
        _.each(mOpenDocuments, function(doc) {
            doc.cm.getWrapperElement().style.height = (height - offset) + 'px';
            doc.cm.refresh();
        });
    }

    var create_new_document = function() {
        console.log("hi");
        self.openTab(null, '', true);
    };

    var initialise = function() {
        // Build up our editor UI.
        mToolbarHolder = $('<div class="btn-toolbar">');
        // Add some basic button groups
        self.addButtonGroup([new ToolbarButton('icon-file', create_new_document, "New file"), new ToolbarButton('icon-refresh'), new ToolbarButton('icon-hdd')]);
        mContainer.append(mToolbarHolder);
        mContainer.css('position', 'relative');

        // Add something to hold our editor tabs
        mTabHolder = $('<ul class="nav nav-tabs">');
        mContainer.append(mTabHolder);

        // Do some one-time setup.
        if(!Editor.IsSetUp) {
            CodeMirror.commands.save = do_save;
            Editor.IsSetUp = true;
        }
    };

    var do_save = function() {
        alert("This would save if there was anywhere useful to save to.");
    };

    initialise();
};
Editor.IsSetUp = false;

var ToolbarButton = function(icon, callback, tooltip) {
    var self = this;
    var mTooltip = tooltip;
    var mIcon = icon;
    var mCallback = callback;
    var mElement = null;

    self.render = function(container) {
        if(mElement) {
            mElement.remove();
            mElement = null;
        }
        // Special case: if 'icon' is a string starting with 'icon-', assume they wanted a Bootstrap icon.
        // Otherwise it's whatever jQuery makes of it.
        if(/^icon-/.test(mIcon)) {
            mIcon = $('<i>').addClass(mIcon);
        }
        mElement = $('<button class="btn">').append(mIcon);
        if(mTooltip) {
            mElement.tooltip({title: mTooltip, placement: 'top', delay: 100});
        }
        if(mCallback) {
            mElement.click(mCallback);
        }
        container.append(mElement);
    };
};
