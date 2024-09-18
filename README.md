# GH Project API

A project to help automate some recurring tasks during a React Native release for the release crew.

## Usage

Change the RC version to the project items that need to be picked (items will be in Inbox)

```bash
bun run src/collect-pick-info.ts 0.76.0-rc1
```

## Output

```
Target release 0.76.0-rc1
b4532ad : 2024-09-16T11:29:47Z : [0.76] Fix Headless Crash Tried to finish non-existent task with id
7bd4a54 : 2024-09-15T07:03:09Z : [0.76] Restore `AnimatedNode.prototype.toJSON`
2d6c59e : 2024-09-13T19:04:52Z : [0.76] Unhide new arch layout props from TypeScript types
af1b18e : 2024-09-13T17:24:44Z : [0.76] fix breaking import for SafeAreaView
d7884a6 : 2024-09-13T16:49:04Z : [0.76] RNGP - Sanitize the output of the config command
4d814f2 : 2024-09-13T16:43:29Z : [0.76] Revert "Remove some Tasks overhead"
cadd41b : 2024-09-12T16:31:25Z : [0.76] Don't add the Privacy Manifest to the project twice
de39a20 : 2024-09-13T15:10:10Z : [0.76] Fix SVC for BoxShadow and Filter
fad4a07 : 2024-09-13T15:10:10Z : [0.76] Fix basic SVC validation
6b369a4 : 2024-09-12T18:46:43Z : [0.76] Removing `experimental_` prefix from `boxShadow` and `filter` and type renaming
2241c31 : 2024-09-11T23:01:06Z : [0.76] Removing `experimental_` prefix from `boxShadow` and `filter` and type renaming
6f84b63 : 2024-09-13T19:35:57Z : [0.76] Removing `experimental_` prefix from `boxShadow` and `filter` and type renaming
eaff327 : 2024-09-13T19:35:57Z : [0.76] Removing `experimental_` prefix from `boxShadow` and `filter` and type renaming
f529fe4 : 2024-09-13T15:16:19Z : [0.76] Exclude dSYM from the archive
aec6666 : 2024-09-12T12:20:36Z : [0.76] Re-add `RCTHermesInstance` constructor for compatibility
81e8c39 : 2024-09-12T14:17:22Z : [0.76] Do not stub SoLoader and revert `com.facebook.common.logging.FLog` breaking change
d7c1e5b : 2024-09-12T21:16:33Z : [0.76] Do not stub SoLoader and revert `com.facebook.common.logging.FLog` breaking change
2136c19 : 2024-09-13T10:51:58Z : [0.76] Do not stub SoLoader and revert `com.facebook.common.logging.FLog` breaking change
69325c1 : 2024-09-11T15:31:15Z : [0.76] Debugger-frontend update for React DevTools panels renaming
af8b232 : 2024-09-11T15:29:13Z : [0.76] Debugger-frontend update to mitigate issues with highlighting elements from React DevTools
e91690d : 2024-09-11T05:25:56Z : [0.76] Expose jsctooling via prefab
b1d42c8 : 2024-09-10T20:21:51Z : [0.76] Expose react_timing headers in reactnative prefab
f41af55 : 2024-09-10T16:57:57Z : [0.76] Expose hermestooling via prefab
833c3a2 : 2024-09-09T14:39:57Z : [0.76] RNGP autolink not properly filter out pure C++ TurboModules

Total picks (24)

To discuss (1):
#480 : [0.76] Bump Metro to latest alpha : https://github.com/reactwg/react-native-releases/issues/480
```
