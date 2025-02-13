import json
from client import TallyClient

def print_section(title: str):
    print(f"\n{'='*20} {title} {'='*20}")

def print_result(data, section="Response"):
    if data and 'data' in data:
        print(f"\n{section}:")
        print(json.dumps(data['data'], indent=2))
    else:
        print("\nNo data or error in response")

def test_tally_api():
    client = TallyClient()
    
    # Test getting key DAOs
    print_section("Key DAOs")
    key_daos = client.get_key_daos()
    print("Available DAOs:", key_daos)
    
    # Use Arbitrum DAO for testing
    test_dao = "arbitrum"
    print(f"\nUsing {test_dao} for testing...")
    
    # Test getting DAO metadata
    print_section("DAO Metadata")
    dao_info = client.get_dao_metadata(test_dao)
    print_result(dao_info)

    if dao_info and 'data' in dao_info and 'organization' in dao_info['data']:
        org_id = dao_info['data']['organization']['id']
        
        # Test getting active proposals
        print_section("Active Proposals")
        proposals = client.get_active_proposals(org_id)
        print_result(proposals)
        
        # Test getting historical proposals
        print_section("Historical Proposals")
        historical = client.get_historical_proposals(org_id, limit=2)
        print_result(historical)
        
        # Test getting token info
        print_section("Token Information")
        token_info = client.get_token_info(org_id)
        print_result(token_info)
        
        # Test getting vote participation stats
        print_section("Vote Participation Stats")
        vote_stats = client.get_vote_participation_stats(org_id)
        print_result(vote_stats)
        
        # Test getting delegation info for a sample address (Active Arbitrum delegate)
        sample_address = "0x8c595DA827F4182bC0E3917BccA8e654DF8223E1"
        print_section(f"Delegate Info for {sample_address}")
        delegate = client.get_delegate_info(sample_address, org_id)
        print_result(delegate)
        
        # Test getting delegation history
        print_section(f"Delegation History for {sample_address}")
        delegation_history = client.get_delegation_history(sample_address, org_id)
        print_result(delegation_history)
        
        # Test getting user governance activity
        print_section(f"Governance Activity for {sample_address}")
        user_activity = client.get_user_governance_activity(sample_address, org_id)
        print_result(user_activity)
        
        # Test aggregated analytics
        print_section("Aggregated DAO Analytics")
        analytics = client.aggregate_dao_analytics(org_id)
        if analytics:
            print(json.dumps(analytics, indent=2))
        else:
            print("No analytics data available")

def main():
    try:
        test_tally_api()
    except Exception as e:
        print(f"Error during testing: {e}")

if __name__ == "__main__":
    main()