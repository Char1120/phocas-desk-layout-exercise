import type { PeopleQuery } from './generated/graphql';

type Person = PeopleQuery['people'][0];

/**
 * requirements teams must sit together.
 * People who don't like dogs should be placed as far away from those who have dogs as possible.
 * People who have dogs should be placed as far apart as possible.
 * Preference to be given to people who would like to avoid dogs. See Example below
 * Desks are arranged in a single line of adjacent desks.
 * Teams sit next to each other, so the team boundary must be taken into account.
 *
 * For example, if given a single team of 5 people with the following preferences:
 * 1. Alice - likes dogs
 * 2. Bob - likes dogs
 * 3. Charlie - doesn't like dogs
 * 4. David - has a dog
 * 5. Eve - has a dog
 *
 * A valid desk layout would be:
 * Charlie(Avoid), Alice(Like), David(Has), Bob(Like), Eve(Has)
 *
 * If Bob left, then a new valid desk layout would be
 * Charlie(Avoid), Alice(Like), David(Has), Eve(Has)
 *
 * There is a test suite provided that is disabled in calculateDeskLayout.spec.ts
 * This test suite may not be exhaustive for all edge cases.
 */
export const calculateDeskLayout = (people: Person[]): Person[] => {
  if (people.length === 0) return [];

  // 1. Group people by team
  const teamGroups = new Map<string, Person[]>();
  for (const person of people) {
    const teamId = person.team?.id ?? 'none';
    if (!teamGroups.has(teamId)) {
      teamGroups.set(teamId, []);
    }
    teamGroups.get(teamId)!.push(person);
  }

  // 2. Sort team members based on dog preferences (AVOID, LIKE, HAVE)
  // for each team, sort members in a way to maximize distance between HAVE and AVOID
  for (const team of teamGroups.values()) {
    const avoid = team.filter((p) => p.dogStatus === 'AVOID');
    const have = team.filter((p) => p.dogStatus === 'HAVE');
    const like = team.filter((p) => p.dogStatus === 'LIKE');

    team.length = 0;

    // start with AVOID members
    team.push(...avoid);

    // if contain more than one HAVE members, put LIKE members in between as buffer
    if (have.length > 1) {
      // calculate how many LIKE people can be put between HAVE
      const likesPerGap = Math.floor(like.length / (have.length + 1));
      const extraLikes = like.length % (have.length + 1);

      let likeIndex = 0;

      // add initial LIKE buffer after AVOID
      const initialLikes = likesPerGap + (extraLikes > 0 ? 1 : 0);
      team.push(...like.slice(likeIndex, initialLikes));
      likeIndex += initialLikes;

      // alternate between HAVE members and LIKE members
      for (let i = 0; i < have.length; i++) {
        team.push(have[i]);

        if (i < have.length - 1) {
          // add LIKE member as buffer between HAVE members
          const likesToAdd = likesPerGap + (extraLikes > i + 1 ? 1 : 0);
          team.push(...like.slice(likeIndex, likeIndex + likesToAdd));
          likeIndex += likesToAdd;
        }
      }

      // add any remaining LIKE members at the end
      if (likeIndex < like.length) {
        team.push(...like.slice(likeIndex));
      }
    } else {
      // have.length = 0 or have.length = 1
      // then, add all LIKE members first
      team.push(...like);
      // if have.length = 1, add at last to maximize distance with AVOID
      team.push(...have);
    }
  }

  // 3. Categorized teams into 8 categories based on dog preferences
  const teams = Array.from(teamGroups.entries());

  // categorize teams with AVOID and HAVE members vs remaining teams
  const teamsWithAvoidAndHave = teams.filter(
    ([, team]) =>
      team.some((p) => p.dogStatus === 'AVOID') && team.some((p) => p.dogStatus === 'HAVE'),
  );

  const remainingTeams = teams.filter(
    ([, team]) =>
      !(team.some((p) => p.dogStatus === 'AVOID') && team.some((p) => p.dogStatus === 'HAVE')),
  );

  // categorize teams with AVOID and HAVE based on ending member
  const teamsWithBothEndHave = teamsWithAvoidAndHave.filter(
    ([, team]) => team[team.length - 1].dogStatus === 'HAVE',
  );

  const teamsWithBothEndLike = teamsWithAvoidAndHave.filter(
    ([, team]) => team[team.length - 1].dogStatus === 'LIKE',
  );

  // categorize remaining teams into same dog preferences vs different dog preferences
  const teamsSamePreferences = remainingTeams.filter(([, team]) => {
    const firstStatus = team[0].dogStatus;
    return team.every((p) => p.dogStatus === firstStatus);
  });

  const teamsDifferentPreferences = remainingTeams.filter(([, team]) => {
    const firstStatus = team[0].dogStatus;
    return !team.every((p) => p.dogStatus === firstStatus);
  });

  // categorize teams with same preferences into three types
  const teamsOnlyAvoid = teamsSamePreferences.filter(([, team]) => team[0].dogStatus === 'AVOID');

  const teamsOnlyLike = teamsSamePreferences.filter(([, team]) => team[0].dogStatus === 'LIKE');

  const teamsOnlyHave = teamsSamePreferences.filter(([, team]) => team[0].dogStatus === 'HAVE');

  // categorize teams with different preferences into three types
  const teamsAvoidEndLike = teamsDifferentPreferences.filter(
    ([, team]) =>
      team.some((p) => p.dogStatus === 'AVOID') &&
      !team.some((p) => p.dogStatus === 'HAVE') &&
      team[team.length - 1].dogStatus === 'LIKE',
  );

  const teamsHaveEndLike = teamsDifferentPreferences.filter(
    ([, team]) =>
      team.some((p) => p.dogStatus === 'HAVE') &&
      !team.some((p) => p.dogStatus === 'AVOID') &&
      team[team.length - 1].dogStatus === 'LIKE',
  );

  const teamsHaveEndHave = teamsDifferentPreferences.filter(
    ([, team]) =>
      team.some((p) => p.dogStatus === 'HAVE') &&
      !team.some((p) => p.dogStatus === 'AVOID') &&
      team[team.length - 1].dogStatus === 'HAVE',
  );

  // 4. Construct middle teams from below 3 categories
  // -teams with AVOID and HAVE and end with HAVE members (teamsWithBothEndHave)
  // -teams with only LIKE (teamsOnlyLike)
  // -teams with HAVE and end with LIKE members (teamsHaveEndLike)
  const teamsInMiddle: [string, Person[]][] = [];

  if (teamsWithBothEndHave.length > 0) {
    // if teamsWithBothEndHave exist
    teamsInMiddle.push(teamsWithBothEndHave[0]); // start with a teamWithBothEndHave

    let bothEndHaveIndex = 1;
    let onlyLikeIndex = 0;
    let haveEndLikeIndex = 0;

    // add teamsOnlyLike and teamsHaveEndLike in between teamsWithBothEndHave
    while (
      bothEndHaveIndex < teamsWithBothEndHave.length ||
      onlyLikeIndex < teamsOnlyLike.length ||
      haveEndLikeIndex < teamsHaveEndLike.length
    ) {
      // first try to add a teamOnlyLike as buffer
      if (onlyLikeIndex < teamsOnlyLike.length) {
        teamsInMiddle.push(teamsOnlyLike[onlyLikeIndex]);
        onlyLikeIndex++;
      }
      // then try to add a teamHaveEndLike as buffer
      else if (haveEndLikeIndex < teamsHaveEndLike.length) {
        teamsInMiddle.push(teamsHaveEndLike[haveEndLikeIndex]);
        haveEndLikeIndex++;
      }

      // add next teamWithBothEndHave if available
      if (bothEndHaveIndex < teamsWithBothEndHave.length) {
        teamsInMiddle.push(teamsWithBothEndHave[bothEndHaveIndex]);
        bothEndHaveIndex++;
      }
    }
  } else {
    // teamsWithBothEndHave does not exist
    // add all teamsOnlyLike first
    teamsInMiddle.push(...teamsOnlyLike);
    // then add all teamsHaveEndLike
    teamsInMiddle.push(...teamsHaveEndLike);
  }

  // 5. Sort teams in a way to maximize distance between HAVE and AVOID across final desk layout
  const result: Person[] = [];

  // add teams with only AVOID at start (teamsOnlyAvoid)
  for (const [, team] of teamsOnlyAvoid) {
    result.push(...team);
  }

  // next, add teams with AVOID and end with LIKE members (teamsAvoidEndLike)
  for (const [, team] of teamsAvoidEndLike) {
    result.push(...team);
  }

  // next, add teams with AVOID and HAVE and end with LIKE members (teamsWithBothEndLike)
  for (const [, team] of teamsWithBothEndLike) {
    result.push(...team);
  }

  // next, add teams in middle
  // -teams with AVOID and HAVE and end with HAVE members (teamsWithBothEndHave)
  // -teams with only LIKE (teamsOnlyLike)
  // -teams with HAVE and end with LIKE members (teamsHaveEndLike)
  for (const [, team] of teamsInMiddle) {
    result.push(...team);
  }

  // next,add teams with HAVE and end with HAVE members (teamsHaveEndHave)
  for (const [, team] of teamsHaveEndHave) {
    result.push(...team);
  }

  // last,add teams with only HAVE (teamsOnlyHave)
  for (const [, team] of teamsOnlyHave) {
    result.push(...team);
  }

  return result;
};
