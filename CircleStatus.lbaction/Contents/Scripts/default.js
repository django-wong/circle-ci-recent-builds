// LaunchBar Action Script

const API_ENDPOINT = "https://circleci.com/api/v1.1";

const icons = {
    'retried'             : '😶',
    'canceled'            : '😶',
    'infrastructure_fail' : '😬',
    'timedout'            : '😬',
    'not_run'             : '😴',
    'running'             : '🧑🏻‍🔧',
    'failed'              : '🥵',
    'queued'              : '😐',
    'scheduled'           : '😐',
    'not_running'         : '😐',
    'no_tests'            : '😶',
    'fixed'               : '🥳',
    'success'             : '🥳'
};

function run(argument) {
    if (argument) {
        return [
            {
                title: 'Save CircleCI Token',
                subtitle: argument,
                alwaysShowsSubtitle: true,
                action: 'saveToken',
                actionArgument: argument,
                actionReturnsItems: false,
                icon: '💾'
            }
        ];
    }

    // Inform the user that there was no argument
    if (!Action.preferences.token) {
        return [
            {
                title: 'Enter API Token',
                subtitle: Action.path,
                alwaysShowsSubtitle: true
            }
        ];
    }

    var items = builds();

    if (items.message) {
        return [
            {
                title: items.message
            }
        ];
    }

    return items.map((item, index) => {
        var seconds = parseInt(item.build_time_millis / 1000 % 60);
        var minutes = Math.floor(item.build_time_millis / 1000 / 60);

        return {
            title: getTitle(item),
            badge: item.status,
            icon: getIcon(item),
            // subtitle: getSubtitle(item),
            children: getChild(item),
            // alwaysShowsSubtitle: true,
            label: `${minutes}m ${seconds}s`
        };
    });
}


function builds() {
    var token = Action.preferences.token;
    var res = HTTP.getJSON(API_ENDPOINT + '/recent-builds?circle-token=' + token);
    return res.data || [];
}


function getTitle(item) {
    return `${item.reponame} #${item.branch}`;
}

// function getSubtitle(item) {
//     var seconds = parseInt(item.build_time_millis / 1000 % 60);
//     var minutes = Math.floor(item.build_time_millis / 1000 / 60);
//     return `Started at ${(new Date(item.committer_date)).toLocaleString()}, Finished in ${minutes}m ${seconds}s`;
// }

function getIcon(item) {
    return icons[item.status] ?? '🧐';
}

function getChild(item) {
    var items = [
        {
            title: `View #${item.build_num} on Circle CI`,
            url: item.build_url,
            icon: 'circle-ci.png'
        }
    ];

    if (['not_run', 'running', 'not_running', 'queued'].indexOf(item.status) != -1) {
        items.push(
            {
                title: 'Cancel',
                action: 'cancel',
                actionArgument: item,
                actionReturnsItems: true,
                icon: '🙅🏻'
            }
        )
    }

    if (['canceled', 'infrastructure_fail', 'timedout', 'success', 'fixed'].indexOf(item.status) != -1) {
        items.push(
            {
                title: 'Retry',
                action: 'retry',
                actionArgument: item,
                actionReturnsItems: true,
                icon: '🙋🏻‍♂️'
            }
        )
    }

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

function saveToken(token) {
    Action.preferences.token = argument;
}


function cancel(build) {
    const url = `${API_ENDPOINT}/project/${build.why}/${build.username}/${build.reponame}/${build.build_num}/cancel`;
    LaunchBar.log(url);

    var {data} = HTTP.postJSON(url, {
        headerFields: {
            'Circle-Token': Action.preferences.token
        }
    });

    data = JSON.parse(data);

    for (key of data) {
        LaunchBar.log(`${key}: ${data[key]}`);
    }

    if (!data.canceled) {
        return [
            {
                title: data.message || 'Operation Failed',
                icon: '⚠️'
            }
        ]
    }

    return [
        {
            title: 'Build has been Canceled',
            icon: '👍🏻'
        }
    ];
}


function retry(build) {
    const url = `${API_ENDPOINT}/project/${build.why}/${build.username}/${build.reponame}/${build.build_num}/retry`;

    var {data} = HTTP.postJSON(url, {
        headerFields: {
            'Circle-Token': Action.preferences.token
        }
    });

    data = JSON.parse(data);

    if (data.status == 'queued') {
        return [
            {
                title: 'Build has been enqueued',
                icon: '👍🏻'
            }
        ]
    }

    return [
        {
            title: data.message || 'Operation Failed',
            icon: '⚠️'
        }
    ];
}