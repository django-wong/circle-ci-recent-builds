// LaunchBar Action Script

const API_ENDPOINT = "https://circleci.com/api/v1.1";

function run(argument) {
    if (argument == undefined) {
        // Inform the user that there was no argument
        if (!Action.preferences.token) {
            return [{
                title: 'Enter API Token',
                subtitle: Action.path,
                alwaysShowsSubtitle: true
            }];
        }

        var items = builds();
        if (items.message) {
            return [{
                title: items.message
            }];
        }

        return items.map((item, index) => {
            return {
                title: getTitle(item),
                badge: item.status,
                icon: getIcon(item),
                subtitle: getSubtitle(item),
                children: getChild(item),
                alwaysShowsSubtitle: true
            };
        });
    } else {
        // // Return a single item that describes the argument
        // return [{ title: '1 argument passed'}, { title : argument }];
        Action.preferences.token = argument;
    }
}


function builds() {
    var token = Action.preferences.token;
    var res = HTTP.getJSON(API_ENDPOINT + '/recent-builds?circle-token=' + token);
    return res.data || [];
}


function getTitle(item) {
    return `${item.reponame} #${item.branch}`;
}

function getSubtitle(item) {
    var seconds = parseInt(item.build_time_millis / 1000 % 60);
    var minutes = Math.floor(item.build_time_millis / 1000 / 60);
    return item.committer_date + `  耗时: ${minutes}m ${seconds}s`;
}

function getIcon(item) {
    if (['success', 'fixed'].indexOf(item.status) !== -1) {
        return 's.png'
    }

    if (item.status === 'running') {
        return 'running.png';
    }

    return 'e.png';
}

function getChild(item) {
    var items = [{
        title: `View #${item.build_num} on Circle CI`,
        url: item.build_url,
        icon: 'circle-ci.png'
    }];

    return items.concat(item.all_commit_details.map((commit, index) => {
        return {
            title: commit.subject,
            url: commit.commit_url,
            subtitle: commit.author_date + ' by ' + commit.committer_name,
            icon: 'github.png',
            alwaysShowsSubtitle: true
        };
    }))
}