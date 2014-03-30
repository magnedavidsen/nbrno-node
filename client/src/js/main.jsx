/** @jsx React.DOM */

require.config({
    baseUrl: "/js/lib",
    paths: { 
        'react': ['//cdnjs.cloudflare.com/ajax/libs/react/0.9.0/react-with-addons.min', 'react/react'],
        'when': ['//cdnjs.cloudflare.com/ajax/libs/when/2.7.1/when.min', 'when/when']
    }
});

require(["rest/rest","rest/interceptor/mime", "react", "when"], function(rest,mime,React, when) {
	
	function resetListView() {
		rest('/api/Rappers').then(function(response) {
			React.renderComponent(
				<RapperList data={JSON.parse(response.entity)} listName="Norges beste rapper"/>,
				document.getElementById('allRappers'));
		});

		rest('/api/Rappers/week').then(function(response) {
			React.renderComponent(
				<RapperList data={JSON.parse(response.entity)} listName="Ukens beste rapper"/>,
				document.getElementById('weekRappers'));
		});

		rest('/api/Rappers/month').then(function(response) {
			React.renderComponent(
				<RapperList data={JSON.parse(response.entity)} listName="Månedens beste rapper"/>,
				document.getElementById('monthRappers'));
		});
	}

	function getTwoRandomRappers(callback) {
		rest('/api/Rappers/tworandom').then(callback);
	}

	function resetVoteView(response) {
		React.renderComponent(
			<VoteView data={JSON.parse(response.entity)}/>,
			document.getElementById('voteView'));
	}

	var RapperListModule = React.createClass({
		render: function() {
			return (
				<div className="rapperLists" >
					<div className="rapperListModule" id="allRappers" />
					<div className="rapperListModule" id="monthRappers" />
					<div className="rapperListModule" id="weekRappers" />
				</div>
				);
		}
	});

	var RapperList = React.createClass({
		render: function() {
			var rappers = this.props.data.map(function (rapper, i) {
				return <div className="listItem">{i+1}. {rapper.name}</div>
			});
			return (
				<div className="rapperList">
					<div className="header">{this.props.listName}</div>
					{rappers}
				</div>
				);
		}
	});

	var RapperBox = React.createClass({


		getInitialState: function() {
   			return {voted: false};
  		},

		handleClick: function(event) {
			var rapperSide = this.props.side;
			var rapperBox = this;

			ga('send', 'event', 'votebox', 'click', rapperSide);
			rapperBox.props.updateReloading(true);

			client = rest.chain(mime, { mime: 'application/json' });
			client({ method: 'POST', path: "/api/Vote", entity: {side:rapperSide} }).then(function(response) {
				var twoRandomPromise = rest('/api/Rappers/tworandom');

    			var wins = response.entity.wins;
    			var losses = response.entity.losses;
    			rapperBox.setState({voted:true, wins:wins, losses:losses});

    			setTimeout(function(){
    				console.log("hide view")
    				twoRandomPromise.then(function(response){
    					console.log("show view")
    					rapperBox.props.updateReloading(false);
    					rapperBox.setState({voted: false});
    					resetVoteView(response);
    				});
    			} ,500);
    		});
  		},

		render: function() {
			console.log("rendering rapperbox");

			  var cx = React.addons.classSet;
				var classes = cx({
				    'rapperBox': true,
				    'reloading': this.props.reloading
				  });

			var notVotedBox = (
				<div className={classes} onClick={this.handleClick} >
					<img src={"data:" +this.props.picture.contentType + ";base64," + this.props.picture.data} />
					<div className="rapperName">{this.props.rapperName}</div>
				</div>
				);

			var votedBox = (
				<div className={classes}>
					<img src={"data:" +this.props.picture.contentType + ";base64," + this.props.picture.data} > </img>
					<div className="rapperName">{this.props.rapperName}</div>					
				</div>
				);

			return this.state.voted ? votedBox : notVotedBox;
		}
	});


	var RappersView = React.createClass({
		getInitialState: function() {
   			return {reloading: false};
  		},

  		setReloading: function(value) {
  			this.setState({reloading: value});
  		},

		render: function() {
			var cx = React.addons.classSet;
				var classes = cx({
				'vs': true,
				'reloading': this.state.reloading
			});

			var leftRapper = this.props.data.left;
			var rightRapper = this.props.data.right;
				
			return (
				
				<div className="voteBox">
					<RapperBox updateReloading={this.setReloading} reloading={this.state.reloading} picture={leftRapper.picture} rapperName={leftRapper.name} side="left" />
					<div className={classes}>vs</div>
					<RapperBox updateReloading={this.setReloading} reloading={this.state.reloading} picture={rightRapper.picture} rapperName={rightRapper.name} side="right"  />
				</div>
				);
		}
	});

	var VoteView = React.createClass({
		render: function() {
			return (
				<div className="voteView">
				<h1>norgesbesterapper.no</h1>
				
				<RappersView data={this.props.data} />
				</div>
				);
		}
	});

	React.renderComponent(
			<RapperListModule />,
			document.getElementById('listView'));

	getTwoRandomRappers(resetVoteView);
	resetListView();
});
