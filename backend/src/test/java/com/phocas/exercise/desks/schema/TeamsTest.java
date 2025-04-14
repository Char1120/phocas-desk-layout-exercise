package com.phocas.exercise.desks.schema;

import java.util.Optional;

import org.junit.jupiter.api.Assertions;

import com.phocassoftware.graphql.database.manager.VirtualDatabase;
import com.phocas.exercise.desks.ApiContext;
import com.phocas.exercise.desks.DeskTestDatabase;

public class TeamsTest {

	@DeskTestDatabase
	public void testAddingTeam(VirtualDatabase database) {
		var context = new ApiContext(database);
		var aTeam = Team.putTeam(context, Optional.empty(), "A Team");
		var teams = Team.teams(context);
		Assertions.assertEquals(1, teams.size());
		aTeam = teams.getFirst();
		Assertions.assertEquals("A Team", aTeam.getName());
		Assertions.assertNotNull(aTeam.getId());
	}

	@DeskTestDatabase
	public void testUpdateTeam(VirtualDatabase database) {
		var context = new ApiContext(database);
		
		// create new team
		var originalTeam = Team.putTeam(context, Optional.empty(), "OriginalTeamName");
		var teams = Team.teams(context);
		Assertions.assertEquals(1, teams.size());
		Assertions.assertEquals("OriginalTeamName", originalTeam.getName());
		
		// update team name
		var updatedTeam = Team.putTeam(context, Optional.of(originalTeam.getId()), "UpdatedTeamName");
		Assertions.assertEquals(originalTeam.getId(), updatedTeam.getId());
		Assertions.assertEquals("UpdatedTeamName", updatedTeam.getName());
		
		// verify updated team name in database
		teams = Team.teams(context);
		Assertions.assertEquals(1, teams.size());
		Assertions.assertEquals("UpdatedTeamName", teams.getFirst().getName());
	}
}
