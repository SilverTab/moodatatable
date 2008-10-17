//******************************************************************************
// MooDataTable 0.1: A data table for MooTools 1.2
// License: MIT License 
// Copyright (c) 2008 Jean-Nicolas Jolivet [http://www.silverscripting.com]

var MooDataTable = new Class({
	Implements: [Events, Options],
	options: {
		url: 'post.php',
		method: 'get',
		perPage: 15,
		// headers: [],
		width: 500
	},
	
	initialize: function(el, options) {
		this.setOptions(options);
		this.el =  $(el);
		this.pages = 0;
		this.createElements();
	},
	
	createElements: function() {
		// build the table structure...
		var structureHtml = "<table><thead><tr></tr></thead><tfoot><tr><td colspan=\"3\"><span class=\"moo-foot-left\"></span><span class=\"moo-foot-right\"></span></td></tr></tfoot><tbody></tbody></table>";
		
		// Assign the HTML and CSS class to our element
		this.el.set('html', structureHtml);
		this.el.addClass('moo-table');
		this.el.setStyle('width', this.options.width + "px");
		// Grab the important elements
		this.table = this.el.getChildren("table")[0];
		this.tableBody = this.table.getChildren("tbody")[0];
		this.tableHead = this.table.getChildren("thead")[0];
		this.footerLeft = this.table.getElements('tfoot > tr > td > span.moo-foot-left')[0];
		this.footerRight = this.table.getElements('tfoot > tr > td > span.moo-foot-right')[0];
		
		// initiate and create the headers
		this.headersEl = [];
		this.createHeaders();
		
	},
	createHeaders: function() {
		var headerTr = this.tableHead.getChildren("tr")[0];
		
		// Create the column headers
		this.options.headers.each(function(header, index){
			var headerTd = new Element('th', {
				id: header['id']
			});
			headerTd.set('html', header['caption']);
			
			// add the click event for column re-ordering
			if(header['sortable']) {
				headerTd.addEvent("click", function(arg1){
					this.reorder(arg1.get('id'));
				}.bind(this, headerTd));
			}
			this.headersEl.push(headerTd);
			headerTd.inject(headerTr);
		}, this);
		
		// Set the initial page and sort column...
		this.page = 1;
		this.sort = 'id';
		// set the sort order to DESC, it will be inverted to ASC by default on first call...
		this.sortOrder = "DESC";
		
		this.reorder(this.options.headers[0]['id']);
	},
	
	reorder: function(id) {
		var orderClass = "";
		if(this.sort == id) {
			// same column clicked... just reverse the order...
			this.sortOrder = this.sortOrder == "DESC" ? "ASC" : "DESC";
		}
		else {
			// new column clicked, set to ASC by default
			this.sortOrder = "ASC";
		}
		
		orderClass = this.sortOrder == "ASC" ? "moo-active-asc" : "moo-active-desc";
		this.activeColumnEl = this.tableHead.getChildren("tr")[0].getChildren("th#" + id)[0];
		this.headersEl.each(function(el){
			el.removeClass('moo-active-column');
			el.removeClass('moo-active-asc');
			el.removeClass('moo-active-desc');
		});
		this.activeColumnEl.addClass("moo-active-column");
		this.activeColumnEl.addClass(orderClass);
		this.sort = id;
		// send the new request
		this.requestData(this.page);
	},
	
	requestData: function(page) {
		// initiate the ajax request...
		this.footerLeft.set('html', 'Loading Data...');
		
		var jsonRequest = new Request.JSON({
			url: this.options.url, 
			method: this.options.method,
			onSuccess: function(resp){
				if(resp == null) {
					this.footerLeft.set('html', "Invalid JSON result...");
				} else {
					this.parseData(resp.total, resp.page, resp.rows);
				}
			}.bind(this),
			onFailure: function() {
				this.footerLeft.set('html', "The request failed...");
			}.bind(this)
		}).send("page=" + page + "&perPage=" + this.options.perPage + '&sort=' + this.sort + '&sortOrder=' + this.sortOrder + '&bust=' + new Date().getTime());
		this.page = page;
		
	},
	
	parseData: function(total, page, rows) {
		// empty the table first...
		this.tableBody.empty();
		rows.each(function(row, index) {
			var index = index + 1;
			// Create a new row...
			var tr = new Element('tr');
			// Check if it's an even row...
			var cssClass = index % 2 == 0 ? 'moo-table-even' : 'moo-table-odd';
			tr.addClass(cssClass);

			row.each(function(cell) {
				var td = new Element('td');
				td.set('html', cell);
				td.inject(tr);
			}, this);
			tr.inject(this.tableBody);
			if(index == this.options.perPage) {
				tr.addClass('moo-table-last');
			}
		}, this);
		// set the total pages if not set...
		if(this.pages === 0) {
			this.pages = Math.ceil(total / this.options.perPage);
		}
		var recMax = this.options.perPage * page;
		recMax = recMax > total ? total : recMax;
		var recMin = (this.options.perPage * page) - (this.options.perPage - 1); 
		// Set the footer data
		this.footerLeft.set('html', "Page " + page + " of " + this.pages + " [ " + recMin + " to " + recMax + " of " + total + " ]");
		this.paginate();
	},
	
	paginate: function() {
		// clear the old pagination...
		//alert(this.page + " " + this.pages);
		this.footerRight.empty();
		
		if(this.pages == 1) {
			return;
		}
		else {
			if(this.page > 1) {
				// previous link
				var prevLink = new Element('a', {
					'html': "Prev",
					'href': "#",
					'events': {
						'click': function() {
							this.pageClicked("prev");
							return false;
						}.bind(this)
					}
				});
				prevLink.inject(this.footerRight);
			}
			// First page
			if(this.page == 1) {
				// We are on the first page so, non-clickable...
				var page1Span = new Element('span', {
					'html': "1",
					'class': 'moo-active-page'
				});
				page1Span.inject(this.footerRight);
			} else {
				// Not on first page so... clickable...
				var page1Link = new Element('a', {
					'html': '1',
					'href': "#",
					'events': {
						'click': function() {
							this.pageClicked("first");
							return false;
						}.bind(this)
					}
				});
				page1Link.inject(this.footerRight);
			}
			

			if(this.page > 2) {
				var leftSpacer = new Element('span', {'html': '...'});
				leftSpacer.inject(this.footerRight);
				if(this.page == this.pages && this.pages > 3) {
					var minusTwo = new Element('a', {
						'html': this.page - 2 + "",
						'href': "#",
						'events': {
							'click': function() {
								this.pageClicked(this.page - 2);
								return false;
							}.bind(this)
						}
					});
					minusTwo.inject(this.footerRight);
				}
				var minusOne = new Element('a', {
					'html': this.page - 1 + "",
					'href': "#",
					'events': {
						'click': function() {
							this.pageClicked(this.page - 1);
							return false;
						}.bind(this)
					}
				});
				minusOne.inject(this.footerRight);
			}
			if(this.page != 1 && this.page != this.pages) {
				var current = new Element('span', {
						'html': this.page + "",
						'class': 'moo-active-page'
					});
					current.inject(this.footerRight);
			}
			if(this.page < this.pages - 1) {
				
				var plusOne = new Element('a', {
					'html': this.page + 1 + "",
					'href': "#",
					'events': {
						'click': function() {
							this.pageClicked(this.page + 1);
							return false;
						}.bind(this)
					}
				});
				plusOne.inject(this.footerRight);
				
				if(this.page == 1 && this.pages > 3) {
					var plusTwo = new Element('a', {
						'html': this.page + 2 + "",
						'href': "#",
						'events': {
							'click': function() {
								this.pageClicked(this.page + 2);
								return false;
							}.bind(this)
						}
					});
					plusTwo.inject(this.footerRight);
				}
				// spacer
				var rightSpacer = new Element('span', {'html': '...'});
				rightSpacer.inject(this.footerRight);
			}
			if(this.page == this.pages) {
				var lastPageSpan = new Element('span', {
					'html': this.pages + "",
					'class': 'moo-active-page'
				});
				lastPageSpan.inject(this.footerRight);
			} else {
				var lastPageLink = new Element('a', {
					'html': this.pages + "",
					'href': "#",
					'events': {
						'click': function() {
							this.pageClicked("last");
							return false;
						}.bind(this)
					}
				});
				lastPageLink.inject(this.footerRight);
			}
			
			if(this.page < this.pages) {
				var nextLink = new Element('a', {
					'html': "Next",
					'href': "#",
					'events': {
						'click': function() {
							this.pageClicked("next");
							return false;
						}.bind(this)
					}
				});
				nextLink.inject(this.footerRight);
			}
		}
	},
	
	pageClicked: function(page) {
		
		if($type(page) === "string") {
			if(page === "next" && this.page < this.pages) {
				this.requestData(this.page + 1);
			}
			else if(page === "prev" && this.page > 1) {
					this.requestData(this.page - 1);
			}
			else if(page === "first" && this.page != 1) {
					this.requestData(1);
			}
			else if(page === "last" && this.page != this.pages) {
					this.requestData(this.pages);
			}
		}
		else {
			if(page > 0 && page <= this.pages) {
				this.requestData(page);
			}
		}
	},
	
	// only "public" method, (with the constructor huh)...
	// used if, for example, you delete a record and you
	// want to refresh the current active page...
	reloadActivePage: function() {
		this.requestData(this.page);
	}
});