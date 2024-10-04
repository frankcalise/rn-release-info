# RN Release Info

A project to help automate some recurring tasks during a React Native release for the release crew.

## Usage

Change the version to the project items that need to be picked. This version should match the issue group found at the project board, e.g.: https://github.com/orgs/reactwg/projects/13/views/1

### Local Run

```bash
bun run src/collect-pick-info.ts 0.76.0-rc1 --sort asc
```

### Via `npx`

```bash
npx rn-release-info 0.76.0-rc1
```

## Options

`--sort asc|desc`
Sorts picks by date ascending or descending

`--verbose`
Outputs title from project issue / PR / commit info in addition to the commit hash and date

## Output

### Standard

```
Target release 0.76.0-rc2
8ac80e3 : 2024-09-10T15:55:34Z
b98b9f1 : 2024-09-13T13:33:30Z
38a4905 : 2024-09-16T15:25:12Z
cf42288 : 2024-09-17T09:34:06Z
1e59f2e : 2024-09-17T16:11:26Z
8972d09 : 2024-09-17T16:42:36Z
42bad68 : 2024-09-18T14:32:59Z
2524c8e : 2024-09-19T10:20:22Z
c6f3282 : 2024-09-19T10:24:41Z

Total picks (9)

To discuss (1):
#503 : [0.76] Fix SVC for lineBreakModeIOS : https://github.com/reactwg/react-native-releases/issues/503
```

### Verbose

```
Target release 0.76.0-rc2
8ac80e3 : 2024-09-10T15:55:34Z

b98b9f1 : 2024-09-13T13:33:30Z
 - packages/react-native/React/Views/ScrollView/RCTScrollView.m
38a4905 : 2024-09-16T15:25:12Z
 - packages/react-native/package.json
 - yarn.lock
cf42288 : 2024-09-17T09:34:06Z

1e59f2e : 2024-09-17T16:11:26Z

8972d09 : 2024-09-17T16:42:36Z
 - packages/react-native/package.json
 - yarn.lock
42bad68 : 2024-09-18T14:32:59Z

2524c8e : 2024-09-19T10:20:22Z

c6f3282 : 2024-09-19T10:24:41Z
 - packages/react-native/React/Views/ScrollView/RCTScrollView.m

Total picks (9)

To discuss (1):
503 : [0.76] Fix SVC for lineBreakModeIOS
 - branch : 0.76-stable
 - https://github.com/reactwg/react-native-releases/issues/503
```
