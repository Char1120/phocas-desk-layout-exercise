import { MockedProvider } from '@apollo/client/testing';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DELETE_TEAM, TEAM_QUERY } from '../queries/teams';
import { mock } from '../testUtil';
import TeamsPage from './TeamsPage';

const mocks = [
  mock(
    TEAM_QUERY,
    {},
    {
      teams: [
        {
          id: '3',
          name: 'A team',
          members: [],
        },
        {
          id: '4',
          name: 'B team',
          members: [],
        },
      ],
    },
  ),
  mock(DELETE_TEAM, { id: '3' }, { deleteTeam: { id: '3' } }),
];

describe('TeamsPage', () => {
  it('renders list', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <TeamsPage />
      </MockedProvider>,
    );

    const names = await screen.findAllByTestId('name');
    expect(names).toHaveLength(2);
    expect(names[0].querySelector('input')).toHaveValue('A team');
    expect(names[1].querySelector('input')).toHaveValue('B team');
  });

  it('test delete', async () => {
    const container = render(
      <MockedProvider mocks={mocks}>
        <TeamsPage />
      </MockedProvider>,
    );

    const deletes = await container.findAllByTestId('delete');
    expect(deletes).toHaveLength(2);

    const user = userEvent.setup();

    await user.click(deletes[0]);

    const names = await container.findAllByTestId('name');

    expect(names).toHaveLength(1);

    expect(names[0].querySelector('input')).toHaveValue('B team');
  });
});
