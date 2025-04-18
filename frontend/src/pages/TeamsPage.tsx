import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import { DELETE_TEAM, PUT_TEAM, TEAM_QUERY } from '../queries/teams';

export default function TeamsPage() {
  const [newTeam, setNewTeam] = useState<string>('');
  const client = useApolloClient();

  const { loading, error, data } = useQuery(TEAM_QUERY);
  const [putTeam] = useMutation(PUT_TEAM, {
    update(cache, { data }, { variables }) {
      let teams = cache.readQuery({ query: TEAM_QUERY })?.teams;
      if (!data || !teams) {
        return;
      }
      if (variables?.id) {
        teams = teams.map((team) => (team.id === data.putTeam.id ? data.putTeam : team));
      } else {
        teams = [...teams, data.putTeam];
      }
      cache.writeQuery({
        query: TEAM_QUERY,
        data: { teams },
      });
    },
  });

  const [deleteTeam] = useMutation(DELETE_TEAM, {
    update(cache, { data }, { variables }) {
      let teams = cache.readQuery({ query: TEAM_QUERY })?.teams;

      if (!data || !teams) {
        return;
      }
      teams = teams.filter((team) => team.id !== variables?.id);
      cache.writeQuery({
        query: TEAM_QUERY,
        data: { teams },
      });
    },
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;

  const handleAddTeam = async () => {
    if (newTeam.trim()) {
      await putTeam({ variables: { name: newTeam } });
      setNewTeam('');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!data?.teams) return;
    const team = data?.teams.find((team) => team.id === teamId);
    if (team) {
      try {
        await deleteTeam({ variables: { id: teamId } });
      } catch (err) {
        console.error('[Delete] error:', err);
      }
    }
  };

  const handleEditTeamChange = (teamId: string, name: string) => {
    if (!data?.teams) return;
    const team = data?.teams.find((team) => team.id === teamId);
    if (team) {
      client.cache.modify({
        id: client.cache.identify(team),
        fields: {
          name: () => name,
        },
      });
    }
  };

  const handleSaveEdit = async (teamId: string) => {
    if (!data?.teams) return;
    const team = data?.teams.find((team) => team.id === teamId);
    if (team) {
      try {
        await putTeam({ variables: { id: teamId, name: team.name } });
      } catch (err) {
        console.error('[Save] Edit error:', err);
      }
    }
  };

  return (
    <div>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>People</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.teams.map((team) => (
              <TableRow key={team.id}>
                <TableCell>
                  <TextField
                    value={team.name}
                    data-testid='name'
                    onChange={(e) => handleEditTeamChange(team.id, e.target.value)}
                    onBlur={() => handleSaveEdit(team.id)}
                  />
                </TableCell>
                <TableCell>
                  <Stack spacing={1} direction='row'>
                    {team.members.map((member) => (
                      <Chip key={member.id} label={member.name} color='primary' />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell>
                  <IconButton
                    data-testid='delete'
                    edge='end'
                    aria-label='delete'
                    onClick={() => handleDeleteTeam(team.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <div style={{ marginTop: '16px' }}>
        <TextField
          data-testid='addTeamName'
          label='Add Team'
          value={newTeam}
          onChange={(e) => setNewTeam(e.target.value)}
        />
        <IconButton
          data-testid='addTeamButton'
          onClick={handleAddTeam}
          aria-label='add'
          style={{ marginLeft: '8px' }}
        >
          <AddIcon />
        </IconButton>
      </div>
    </div>
  );
}
